//! Odd-index mints for the launched stp trump2028 family.
//!
//! No genesis, no splits, no reclaims. The payer key is read from `ODD_KEY`.
//! Recipient keys are written only to `ODD_KEYS`, outside the repository.
//! This module never prints a private key.

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::str::FromStr;

use argent::artifact::Artifact;
use argent_runtime::{args, state, CovenantOutput, EntryCall, InputSigScript, TxBuilder, TxContext};
use kaspa_addresses::{Address, Prefix, Version};
use kaspa_consensus_core::mass::MassCalculator;
use kaspa_consensus_core::tx::{
    CovenantBinding, MutableTransaction, ScriptPublicKey, Transaction, TransactionId, TransactionOutpoint,
    UtxoEntry,
};
use secp256k1::{Keypair, Secp256k1, SecretKey};

use super::support::{sign_input, DemoResult};
use super::TokenState;

const EXTENSION_HEX: &str = "379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706";
const COVENANT_HEX: &str = "89997c2e03251a4abd22263bf2ac3a11394c9729a32a8520789c60ce2d6f9d67";
const LEAF_SCRIPT_HEX: &str = "aa2011294ec4f2207d28c28eae2fc8a765867f99b4fdc8deb9754b4c7d84a3ce10c687";
const LIMIT: i64 = 4_056;
const KAS: u64 = 100_000_000;
const STORAGE_LIMIT: u64 = 500_000;
const BLOCK_COMPUTE: u64 = 500_000;
const BLOCK_TRANSIENT: u64 = 1_000_000;

struct Coin {
    outpoint: TransactionOutpoint,
    entry: UtxoEntry,
}

struct Leaf {
    index: usize,
    outpoint: TransactionOutpoint,
    utxo: UtxoEntry,
    covenant_id: kaspa_consensus_core::Hash,
}

struct Ready {
    tx: Transaction,
    storage: u64,
    compute: u64,
    transient: u64,
    fee: u64,
}

pub fn run(artifact: &Artifact) -> DemoResult<()> {
    let extension = extension_bytes()?;
    let (payer, payer_public) = load_key()?;
    let deposit_owner = deposit_owner()?;
    let covenant_id = kaspa_consensus_core::Hash::from_str(COVENANT_HEX)?;
    let leaf_script = ScriptPublicKey::from_vec(0, hex_decode(LEAF_SCRIPT_HEX)?);
    let rate = fee_rate()?;
    let limit = odd_limit()?;
    let out_dir = std::env::var("ODD_OUT").map_err(|_| "ODD_OUT")?;
    if out_dir.replace('/', "\\").to_ascii_lowercase().contains("\\map\\") {
        return Err("ODD_OUT is inside the map tree".into());
    }
    let keys_path = std::env::var("ODD_KEYS").map_err(|_| "ODD_KEYS")?;
    fs::create_dir_all(&out_dir)?;
    let mut coin = load_funding(&payer_public)?;
    let leaves = load_leaves(&leaf_script, covenant_id, &deposit_owner)?;
    let chosen: Vec<&Leaf> = leaves.iter().filter(|leaf| leaf.index % 2 == 1).take(limit).collect();
    if chosen.is_empty() {
        return Err("no open odd leaf".into());
    }
    let tx_path = format!("{out_dir}/txs.jsonl");
    fs::write(&tx_path, "")?;
    let builder = TxBuilder::new(artifact)?;
    let mut mints = String::from("[\n");
    for (nth, leaf) in chosen.iter().enumerate() {
        let (recipient, recipient_public) = fresh_key();
        append_secret(&keys_path, leaf.index, &recipient)?;
        let (ready, next) = build_odd_mint(
            &builder,
            &payer,
            &payer_public,
            &deposit_owner,
            &extension,
            leaf,
            &recipient_public,
            &coin,
            rate,
        )?;
        append_tx(&tx_path, leaf.index, &ready)?;
        coin = next;
        if nth > 0 {
            mints.push_str(",\n");
        }
        mints.push_str(&format!(
            "{{\"index\":{},\"address\":\"{}\",\"txid\":\"{}\",\"amount\":{LIMIT},\"remaining\":0}}",
            leaf.index,
            address_of(&recipient_public),
            ready.tx.id()
        ));
        if (nth + 1) % 50 == 0 {
            eprintln!("odds {}", nth + 1);
        }
    }
    mints.push_str("\n]\n");
    fs::write(format!("{out_dir}/mints.json"), mints)?;
    println!("odds {}", chosen.len());
    println!("feeRate {rate}");
    Ok(())
}

fn build_odd_mint(
    builder: &TxBuilder<'_>,
    payer: &Keypair,
    payer_public: &[u8; 32],
    deposit_owner: &[u8; 32],
    extension: &[u8; 32],
    leaf: &Leaf,
    recipient: &[u8; 32],
    coin: &Coin,
    rate: u64,
) -> DemoResult<(Ready, Coin)> {
    let ready = fit_fee(rate, |fee| {
        let change_value = coin.entry.amount.checked_sub(KAS).and_then(|value| value.checked_sub(fee)).ok_or("change")?;
        let binding = CovenantBinding::new(0, leaf.covenant_id);
        let minted = token_state(LIMIT, recipient, extension);
        let owner = *deposit_owner;
        let tx = builder.build(
            &TxContext::new()
                .actor_input(
                    "PublicMint",
                    minter_state(LIMIT, &owner, extension),
                    EntryCall::new("mint").args(args!(minted.clone())),
                    leaf.outpoint,
                    leaf.utxo.clone(),
                    0,
                )
                .input(
                    coin.outpoint,
                    coin.entry.clone(),
                    InputSigScript::with_transaction(|tx, index| p2pk_signature(&sign_input(tx, index, payer))),
                    0,
                )
                .actor_output("PublicMint", minter_state(0, &owner, extension), binding, leaf.utxo.amount)
                .actor_output("KCC20", minted, binding, KAS)
                .output(p2pk(payer_public), None, change_value),
        )?;
        commit(tx, &[leaf.utxo.clone(), coin.entry.clone()])
    })?;
    let change = change_coin(&ready.tx, 2)?;
    let _emptied = CovenantOutput::from_tx(&ready.tx, 0)?;
    Ok((ready, change))
}

fn extension_bytes() -> DemoResult<[u8; 32]> {
    let extension = *blake3::hash(b"stp trump2028").as_bytes();
    if hex(&extension) != EXTENSION_HEX {
        return Err("extension".into());
    }
    Ok(extension)
}

fn fee_rate() -> DemoResult<u64> {
    let text = std::env::var("ODD_FEE_RATE").map_err(|_| "ODD_FEE_RATE")?;
    let rate = text.trim().parse::<u64>()?;
    if rate == 0 || rate > 10_000 {
        return Err("fee rate".into());
    }
    Ok(rate)
}

fn odd_limit() -> DemoResult<usize> {
    match std::env::var("ODD_LIMIT") {
        Err(_) => Ok(usize::MAX),
        Ok(text) if text.trim().is_empty() => Ok(usize::MAX),
        Ok(text) => {
            let limit = text.trim().parse::<usize>()?;
            if limit == 0 {
                return Err("ODD_LIMIT".into());
            }
            Ok(limit)
        }
    }
}

fn load_key() -> DemoResult<(Keypair, [u8; 32])> {
    let path = std::env::var("ODD_KEY").map_err(|_| "ODD_KEY")?;
    let secret = hex_decode(fs::read_to_string(&path)?.trim())?;
    if secret.len() != 32 {
        return Err("key length".into());
    }
    let mut raw = [0u8; 32];
    raw.copy_from_slice(&secret);
    let secret_key = SecretKey::from_slice(&raw)?;
    let key = Keypair::from_secret_key(&Secp256k1::new(), &secret_key);
    Ok((key, key.x_only_public_key().0.serialize()))
}

fn deposit_owner() -> DemoResult<[u8; 32]> {
    let text = std::env::var("ODD_DEPOSIT_ADDRESS").map_err(|_| "ODD_DEPOSIT_ADDRESS")?;
    let address = Address::try_from(text.trim())?;
    if address.prefix != Prefix::Testnet || address.version != Version::PubKey || address.payload.len() != 32 {
        return Err("deposit address".into());
    }
    let mut owner = [0u8; 32];
    owner.copy_from_slice(&address.payload);
    Ok(owner)
}

fn load_funding(payer_public: &[u8; 32]) -> DemoResult<Coin> {
    let path = std::env::var("ODD_FUNDING").map_err(|_| "ODD_FUNDING")?;
    let text = fs::read_to_string(path)?;
    let txid = value_of(&text, "txid")?;
    let index: u32 = value_of(&text, "index")?.parse()?;
    let amount: u64 = value_of(&text, "amount")?.parse()?;
    let script = hex_decode(value_of(&text, "script")?)?;
    let coinbase = value_of(&text, "coinbase")? == "1";
    let block_daa: u64 = value_of(&text, "blockDaa")?.parse()?;
    if script.as_slice() != p2pk(payer_public).script() {
        return Err("funding script".into());
    }
    if amount < KAS {
        return Err("funding".into());
    }
    Ok(Coin {
        outpoint: TransactionOutpoint::new(TransactionId::from_str(txid)?, index),
        entry: UtxoEntry::new(amount, ScriptPublicKey::from_vec(0, script), block_daa, coinbase, None),
    })
}

fn load_leaves(
    script: &ScriptPublicKey,
    covenant_id: kaspa_consensus_core::Hash,
    deposit_owner: &[u8; 32],
) -> DemoResult<Vec<Leaf>> {
    let path = std::env::var("ODD_LEAVES").map_err(|_| "ODD_LEAVES")?;
    let text = fs::read_to_string(path)?;
    let mut leaves = Vec::new();
    for object in text.split("},{") {
        if !object.contains("\"index\"") {
            continue;
        }
        let index = field_num(object, "index")? as usize;
        let remaining = field_num(object, "remaining")?;
        if index % 2 == 0 || remaining != LIMIT {
            continue;
        }
        let deposit = field_str(object, "depositAddress")?;
        let decoded = Address::try_from(deposit)?;
        if decoded.payload.as_slice() != deposit_owner {
            return Err("deposit owner changed".into());
        }
        let outpoint = field_str(object, "outpoint")?;
        let (txid, index_text) = outpoint.split_once(':').ok_or("outpoint")?;
        let mut entry = UtxoEntry::new(KAS, script.clone(), 0, false, Some(covenant_id));
        entry.covenant_id = Some(covenant_id);
        leaves.push(Leaf {
            index,
            outpoint: TransactionOutpoint::new(TransactionId::from_str(txid)?, index_text.parse()?),
            utxo: entry,
            covenant_id,
        });
    }
    leaves.sort_by_key(|leaf| leaf.index);
    Ok(leaves)
}

fn field_num(object: &str, key: &str) -> DemoResult<i64> {
    let raw = field_raw(object, key)?;
    Ok(raw.trim_matches('"').parse()?)
}

fn field_str<'a>(object: &'a str, key: &str) -> DemoResult<&'a str> {
    let raw = field_raw(object, key)?;
    Ok(raw.trim_matches('"'))
}

fn field_raw<'a>(object: &'a str, key: &str) -> DemoResult<&'a str> {
    let needle = format!("\"{key}\":");
    let start = object.find(&needle).ok_or("field")? + needle.len();
    let rest = &object[start..];
    let end = rest.find([',', '}']).unwrap_or(rest.len());
    Ok(rest[..end].trim())
}

fn value_of<'a>(text: &'a str, key: &str) -> DemoResult<&'a str> {
    for line in text.lines() {
        if let Some(value) = line.strip_prefix(&format!("{key}=")) {
            return Ok(value.trim());
        }
    }
    Err(format!("funding {key}").into())
}

fn fresh_key() -> (Keypair, [u8; 32]) {
    let secret = SecretKey::new(&mut secp256k1::rand::rngs::OsRng);
    let key = Keypair::from_secret_key(&Secp256k1::new(), &secret);
    (key, key.x_only_public_key().0.serialize())
}

fn append_secret(path: &str, index: usize, key: &Keypair) -> DemoResult<()> {
    if let Some(parent) = std::path::Path::new(path).parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    writeln!(file, "{index} {}", hex(key.secret_key().secret_bytes().as_ref()))?;
    Ok(())
}

fn minter_state(remaining: i64, owner: &[u8; 32], extension: &[u8; 32]) -> TokenState {
    state! {
        remaining: remaining,
        mint_amount: LIMIT,
        owner: owner.to_vec(),
        extension_commitment: extension.to_vec()
    }
}

fn token_state(amount: i64, owner: &[u8; 32], extension: &[u8; 32]) -> TokenState {
    state! {
        amount: amount,
        owner: owner.to_vec(),
        owner_scheme: 0u8,
        borrow_scheme: 0u8,
        borrow_guard: vec![0u8; 32],
        extension_commitment: extension.to_vec()
    }
}

fn p2pk(public_key: &[u8; 32]) -> ScriptPublicKey {
    let mut script = Vec::with_capacity(34);
    script.push(32);
    script.extend_from_slice(public_key);
    script.push(0xac);
    ScriptPublicKey::from_vec(0, script)
}

fn p2pk_signature(raw: &[u8]) -> Vec<u8> {
    let mut script = Vec::with_capacity(1 + raw.len());
    script.push(u8::try_from(raw.len()).expect("signature length"));
    script.extend_from_slice(raw);
    script
}

fn address_of(public_key: &[u8; 32]) -> String {
    Address::new(Prefix::Testnet, Version::PubKey, public_key).to_string()
}

fn commit(mut tx: Transaction, entries: &[UtxoEntry]) -> DemoResult<Ready> {
    let calculator = MassCalculator::new(1, 10, 1_000_000_000_000);
    let populated = MutableTransaction::with_entries(tx.clone(), entries.to_vec());
    let storage = calculator.calc_contextual_masses(&populated.as_verifiable()).ok_or("storage mass")?.storage_mass;
    if storage > STORAGE_LIMIT {
        return Err(format!("storage {storage}").into());
    }
    tx.set_storage_mass(storage);
    tx.finalize();
    let masses = calculator.calc_non_contextual_masses(&tx);
    if masses.compute_mass > BLOCK_COMPUTE || masses.transient_mass > BLOCK_TRANSIENT {
        return Err("mass".into());
    }
    let input_value: u64 = entries.iter().map(|entry| entry.amount).sum();
    let output_value: u64 = tx.outputs.iter().map(|output| output.value).sum();
    if input_value < output_value {
        return Err("values".into());
    }
    Ok(Ready {
        tx,
        storage,
        compute: masses.compute_mass,
        transient: masses.transient_mass,
        fee: input_value - output_value,
    })
}

fn required_fee(item: &Ready, rate: u64) -> u64 {
    let relay = item.compute.max(item.transient.div_ceil(2));
    item.storage.max(relay).saturating_mul(rate).max(1)
}

fn fit_fee(rate: u64, build: impl Fn(u64) -> DemoResult<Ready>) -> DemoResult<Ready> {
    let mut fee = rate.saturating_mul(20_000).max(1);
    let mut last = String::from("no fee");
    for _ in 0..8 {
        match build(fee) {
            Ok(ready) => {
                let need = required_fee(&ready, rate);
                if ready.fee >= need {
                    return Ok(ready);
                }
                last = format!("need {need} had {}", ready.fee);
                fee = need;
            }
            Err(error) => {
                last = error.to_string();
                if last.contains("storage") {
                    return Err(last.into());
                }
                fee = fee.saturating_mul(2).max(fee.saturating_add(1_000_000));
            }
        }
    }
    Err(last.into())
}

fn change_coin(tx: &Transaction, index: u32) -> DemoResult<Coin> {
    let output = tx.outputs.get(index as usize).ok_or("change index")?;
    if output.covenant.is_some() {
        return Err("change is a covenant".into());
    }
    Ok(Coin {
        outpoint: TransactionOutpoint::new(tx.id(), index),
        entry: UtxoEntry::new(output.value, output.script_public_key.clone(), 0, false, None),
    })
}

fn append_tx(path: &str, index: usize, ready: &Ready) -> DemoResult<()> {
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    writeln!(
        file,
        "{{\"kind\":\"mint\",\"detail\":\"{index}\",\"storage\":{},\"compute\":{},\"transient\":{},\"fee\":\"{}\",\"tx\":{}}}",
        ready.storage,
        ready.compute,
        ready.transient,
        ready.fee,
        tx_json(&ready.tx)
    )?;
    Ok(())
}

fn tx_json(tx: &Transaction) -> String {
    let raw = borsh::to_vec(tx).expect("borsh");
    let mut inputs = String::from("[");
    for (index, input) in tx.inputs.iter().enumerate() {
        if index > 0 {
            inputs.push(',');
        }
        inputs.push_str(&format!(
            "{{\"transactionId\":\"{}\",\"index\":{},\"sequence\":\"{}\",\"sigOpCount\":{},\"computeBudget\":{},\"signatureScript\":\"{}\"}}",
            input.previous_outpoint.transaction_id,
            input.previous_outpoint.index,
            input.sequence,
            input.compute_commit.sig_op_count().unwrap_or(0),
            input.compute_commit.compute_budget().unwrap_or(0),
            hex(&input.signature_script)
        ));
    }
    inputs.push(']');
    let mut outputs = String::from("[");
    for (index, output) in tx.outputs.iter().enumerate() {
        if index > 0 {
            outputs.push(',');
        }
        let covenant = match output.covenant {
            Some(binding) => format!(
                "{{\"authorizingInput\":{},\"covenantId\":\"{}\"}}",
                binding.authorizing_input, binding.covenant_id
            ),
            None => "null".to_string(),
        };
        outputs.push_str(&format!(
            "{{\"value\":\"{}\",\"scriptVersion\":{},\"script\":\"{}\",\"covenant\":{covenant}}}",
            output.value,
            output.script_public_key.version(),
            hex(output.script_public_key.script())
        ));
    }
    outputs.push(']');
    format!(
        "{{\"id\":\"{}\",\"version\":{},\"lockTime\":\"{}\",\"gas\":\"{}\",\"subnetworkId\":\"{}\",\"payload\":\"{}\",\"storageMass\":\"{}\",\"inputs\":{inputs},\"outputs\":{outputs},\"borsh\":\"{}\"}}",
        tx.id(),
        tx.version,
        tx.lock_time,
        tx.gas,
        hex(tx.subnetwork_id.as_bytes()),
        hex(&tx.payload),
        tx.storage_mass(),
        hex(&raw)
    )
}

fn hex(bytes: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(DIGITS[(byte >> 4) as usize] as char);
        out.push(DIGITS[(byte & 0x0f) as usize] as char);
    }
    out
}

fn hex_decode(text: &str) -> DemoResult<Vec<u8>> {
    if text.len() % 2 != 0 {
        return Err("hex".into());
    }
    let mut out = Vec::with_capacity(text.len() / 2);
    let bytes = text.as_bytes();
    let mut index = 0;
    while index < bytes.len() {
        let high = hex_value(bytes[index])?;
        let low = hex_value(bytes[index + 1])?;
        out.push((high << 4) | low);
        index += 2;
    }
    Ok(out)
}

fn hex_value(byte: u8) -> DemoResult<u8> {
    match byte {
        b'0'..=b'9' => Ok(byte - b'0'),
        b'a'..=b'f' => Ok(byte - b'a' + 10),
        b'A'..=b'F' => Ok(byte - b'A' + 10),
        _ => Err("hex".into()),
    }
}
