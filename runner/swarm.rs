//! Compiled as `src/bin/kcc20/swarm.rs` inside kcc20-reference `8c8dc8ee`.
//! Not a standalone crate.
//!
//! Offline swarm: one limited mint, split into 150 minters, then 150 callers.
//!
//! The callers do not share a minter output, so the script engine can accept
//! every mint on its own. Two mints of the same output still spend one outpoint.

use std::time::Instant;

use argent::artifact::Artifact;
use argent_runtime::{CovenantOutput, EntryCall, TxBuilder, TxContext, args, state};
use kaspa_consensus_core::{
    Hash,
    tx::{CovenantBinding, ScriptPublicKey, Transaction, TransactionId, TransactionOutpoint, UtxoEntry},
};
use secp256k1::{Keypair, Secp256k1, SecretKey};

use super::support::DemoResult;
use super::{BORROW_DISABLED, OWNER_P2PK_SCHNORR, TOKEN_OUTPUT_SOMPI};

fn funding() -> UtxoEntry {
    UtxoEntry::new(
        TOKEN_OUTPUT_SOMPI * 2,
        ScriptPublicKey::from_vec(0, vec![0x51]),
        1,
        false,
        None,
    )
}

const NAME: &[u8] = b"stp trump2028";
const SUPPLY: i64 = 20_280_000;
const LIMIT: i64 = 135_200;
const CALLERS: usize = 150;
const EXTENSION_HEX: &str = "379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706";

struct Leaf {
    remaining: i64,
    owner: [u8; 32],
    covenant_id: Hash,
    outpoint: TransactionOutpoint,
    utxo: UtxoEntry,
}

fn hex32(bytes: &[u8; 32]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(64);
    for byte in bytes {
        out.push(DIGITS[(byte >> 4) as usize] as char);
        out.push(DIGITS[(byte & 0x0f) as usize] as char);
    }
    out
}

fn key_for(n: u32) -> (Keypair, [u8; 32]) {
    let mut seed = [0u8; 32];
    seed[..4].copy_from_slice(&n.to_le_bytes());
    seed[31] = 0x5a;
    let secret = SecretKey::from_slice(&seed).expect("demo key");
    let key = Keypair::from_secret_key(&Secp256k1::new(), &secret);
    (key, key.x_only_public_key().0.serialize())
}

fn outpoint(n: u64) -> TransactionOutpoint {
    let mut bytes = [0u8; 32];
    bytes[..8].copy_from_slice(&n.to_le_bytes());
    bytes[31] = 0xa5;
    TransactionOutpoint::new(TransactionId::from_bytes(bytes), 0)
}

fn minter_state(remaining: i64, owner: &[u8; 32], extension: &[u8; 32]) -> super::TokenState {
    state! {
        remaining: remaining,
        mint_amount: LIMIT,
        owner: owner.to_vec(),
        extension_commitment: extension.to_vec()
    }
}

fn token_state(amount: i64, owner: &[u8; 32], extension: &[u8; 32]) -> super::TokenState {
    state! {
        amount: amount,
        owner: owner.to_vec(),
        owner_scheme: OWNER_P2PK_SCHNORR,
        borrow_scheme: BORROW_DISABLED,
        borrow_guard: vec![0u8; 32],
        extension_commitment: extension.to_vec()
    }
}

fn seeder_state(owner: &[u8; 32], extension: &[u8; 32]) -> super::TokenState {
    state! {
        owner: owner.to_vec(),
        extension_commitment: extension.to_vec()
    }
}

fn leaf_from(tx: &Transaction, index: u32, remaining: i64, owner: [u8; 32]) -> DemoResult<Leaf> {
    let output = CovenantOutput::from_tx(tx, index)?;
    Ok(Leaf {
        remaining,
        owner,
        covenant_id: output.covenant_id,
        outpoint: output.outpoint,
        utxo: output.utxo,
    })
}

fn split_one(
    builder: &TxBuilder<'_>,
    parent: &Leaf,
    take: i64,
    child_owner: [u8; 32],
    extension: &[u8; 32],
    funding_n: u64,
) -> DemoResult<(Leaf, Leaf)> {
    let binding = CovenantBinding::new(0, parent.covenant_id);
    let tx = builder.build(
        &TxContext::new()
            .actor_input(
                "PublicMint",
                minter_state(parent.remaining, &parent.owner, extension),
                EntryCall::new("split").args(args!(take, child_owner.to_vec())),
                parent.outpoint,
                parent.utxo.clone(),
                0,
            )
            .input(outpoint(funding_n), funding(), Vec::new(), 0)
            .actor_output(
                "PublicMint",
                minter_state(parent.remaining - take, &parent.owner, extension),
                binding,
                TOKEN_OUTPUT_SOMPI,
            )
            .actor_output(
                "PublicMint",
                minter_state(take, &child_owner, extension),
                binding,
                TOKEN_OUTPUT_SOMPI,
            ),
    )?;
    let retained = leaf_from(&tx, 0, parent.remaining - take, parent.owner)?;
    let added = leaf_from(&tx, 1, take, child_owner)?;
    Ok((retained, added))
}

fn mint_one(
    builder: &TxBuilder<'_>,
    leaf: &Leaf,
    caller: [u8; 32],
    extension: &[u8; 32],
    funding_n: u64,
) -> DemoResult<Transaction> {
    let binding = CovenantBinding::new(0, leaf.covenant_id);
    let minted = token_state(LIMIT, &caller, extension);
    let tx = builder.build(
        &TxContext::new()
            .actor_input(
                "PublicMint",
                minter_state(leaf.remaining, &leaf.owner, extension),
                EntryCall::new("mint").args(args!(minted.clone())),
                leaf.outpoint,
                leaf.utxo.clone(),
                0,
            )
            .input(outpoint(funding_n), funding(), Vec::new(), 0)
            .actor_output(
                "PublicMint",
                minter_state(leaf.remaining - LIMIT, &leaf.owner, extension),
                binding,
                TOKEN_OUTPUT_SOMPI,
            )
            .actor_output("KCC20", minted, binding, TOKEN_OUTPUT_SOMPI),
    )?;
    Ok(tx)
}

pub fn run(artifact: &Artifact) -> DemoResult<()> {
    let started = Instant::now();
    let extension = *blake3::hash(NAME).as_bytes();
    if hex32(&extension) != EXTENSION_HEX {
        return Err("name commitment does not match the lab".into());
    }
    let builder = TxBuilder::new(artifact)?;
    let (_, deposit_owner) = key_for(1);

    let launch = builder.build(
        &TxContext::new()
            .input(outpoint(1), funding(), Vec::new(), 0)
            .actor_genesis_output(
                0,
                "launch::stp-trump2028",
                "PublicMint",
                minter_state(SUPPLY, &deposit_owner, &extension),
                TOKEN_OUTPUT_SOMPI,
            )
            .actor_genesis_output(
                0,
                "launch::stp-trump2028",
                "TokenSeed",
                seeder_state(&deposit_owner, &extension),
                TOKEN_OUTPUT_SOMPI,
            ),
    )?;
    let minter = CovenantOutput::from_tx(&launch, 0)?;
    let seeder = CovenantOutput::from_tx(&launch, 1)?;
    if minter.covenant_id != seeder.covenant_id {
        return Err("genesis outputs did not share a covenant id".into());
    }
    println!("launch {}", launch.id());
    println!("covenant {}", minter.covenant_id);

    let mut leaves = vec![leaf_from(&launch, 0, SUPPLY, deposit_owner)?];
    let mut funding_n = 10u64;
    let mut child_n = 2u32;
    let mut round_sizes = Vec::new();
    while leaves.iter().any(|leaf| leaf.remaining > LIMIT) {
        let mut produced = Vec::new();
        let mut splits = 0usize;
        for leaf in leaves {
            if leaf.remaining == LIMIT {
                produced.push(leaf);
                continue;
            }
            if leaf.remaining % LIMIT != 0 {
                return Err("allowance is not a whole number of mint limits".into());
            }
            let take = (leaf.remaining / LIMIT / 2) * LIMIT;
            if take <= 0 || take > leaf.remaining / 2 {
                return Err("split take broke the half rule".into());
            }
            let (_, child_owner) = key_for(child_n);
            child_n += 1;
            let (retained, added) = split_one(
                &builder,
                &leaf,
                take,
                child_owner,
                &extension,
                funding_n,
            )?;
            funding_n += 1;
            produced.push(retained);
            produced.push(added);
            splits += 1;
        }
        round_sizes.push(splits);
        leaves = produced;
        println!(
            "round {} splits {splits} minters {}",
            round_sizes.len(),
            leaves.len()
        );
    }

    if leaves.len() != CALLERS || round_sizes != [1, 2, 4, 8, 16, 32, 64, 22] {
        return Err(format!(
            "unexpected tree: {} leaves, rounds {round_sizes:?}",
            leaves.len()
        )
        .into());
    }

    let caller_keys: Vec<[u8; 32]> = (0..CALLERS).map(|index| key_for(10_000 + index as u32).1).collect();
    let duplicate = mint_one(&builder, &leaves[0], caller_keys[0], &extension, 50_000)?;
    let duplicate_other = mint_one(&builder, &leaves[0], caller_keys[1], &extension, 50_001)?;
    if duplicate.inputs[0].previous_outpoint != duplicate_other.inputs[0].previous_outpoint {
        return Err("the pair did not spend the same minter".into());
    }

    let mint_started = Instant::now();
    let mut minted = Vec::with_capacity(CALLERS);
    for index in (0..CALLERS).rev() {
        let tx = mint_one(
            &builder,
            &leaves[index],
            caller_keys[index],
            &extension,
            60_000 + index as u64,
        )?;
        minted.push(tx);
    }
    let mint_ms = mint_started.elapsed().as_millis();

    let exhausted = CovenantOutput::from_tx(&minted[0], 0)?;
    let over = builder.build(
        &TxContext::new()
            .actor_input(
                "PublicMint",
                minter_state(0, &leaves[CALLERS - 1].owner, &extension),
                EntryCall::new("mint").args(args!(token_state(1, &caller_keys[0], &extension))),
                exhausted.outpoint,
                exhausted.utxo,
                0,
            )
            .input(outpoint(70_000), funding(), Vec::new(), 0)
            .actor_output(
                "PublicMint",
                minter_state(0, &leaves[CALLERS - 1].owner, &extension),
                CovenantBinding::new(0, exhausted.covenant_id),
                TOKEN_OUTPUT_SOMPI,
            )
            .actor_output(
                "KCC20",
                token_state(1, &caller_keys[0], &extension),
                CovenantBinding::new(0, exhausted.covenant_id),
                TOKEN_OUTPUT_SOMPI,
            ),
    );
    if over.is_ok() {
        return Err("a mint past zero was accepted".into());
    }

    let ids: std::collections::BTreeSet<_> = minted.iter().map(|tx| tx.id()).collect();
    if ids.len() != CALLERS {
        return Err("mint ids were not distinct".into());
    }
    let issued = LIMIT * CALLERS as i64;
    if issued != SUPPLY {
        return Err("issued supply does not match the cap".into());
    }
    println!(
        "swarm name=stp-trump2028 extension={EXTENSION_HEX} callers={CALLERS} issued={issued} split_txs={} rounds={round_sizes:?} mint_ok={} same_outpoint_pair=2 over_mint=rejected mint_ms={mint_ms} total_ms={}",
        round_sizes.iter().sum::<usize>(),
        minted.len(),
        started.elapsed().as_millis()
    );
    println!("first_in_reverse {}", minted[0].id());
    println!("last_in_reverse {}", minted[minted.len() - 1].id());
    Ok(())
}
