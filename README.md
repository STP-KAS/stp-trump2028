> **Experimental. Not advice.**
>
> Local proof of a limited public mint. Not money. Not a dollar. Not Kaspa core.
> [DISCLAIMER.md](DISCLAIMER.md)

# stp trump2028

A local mint of a KCC-style token named `stp trump2028`. Supply is 20,280,000 base units. One mint may take at most 135,200. One hundred and fifty callers mint it, each at a different fee ratio. Nothing in this folder is submitted to a network.

## What

KCC means Kaspa Covenant Convention. KCC-20 is the Draft fungible-token covenant. On kaspanet/kccs commit `411b41bc` the text standardizes six state fields and a transfer. The fields, in order, are amount, owner, owner scheme, borrow scheme, borrow guard, and extension commitment. A transfer keeps the sum of the amounts. The same extension commitment is what makes two states the same token. The Draft has no mint chapter and no supply cap.

Issuance lives in the reference app `KCC20PublicMint`, on the open pull argent-lang/kcc20-reference#1. The README at commit `72767847` (7 Oct 2026, 13:44Z) describes it. The mint code is the parent commit `8c8dc8ee`, file `contracts/public_mint.ag`. That app is a local Argent program. Its own examples do not submit transactions. The reference repository's master branch is still the 10 Sep stub `76648f99`. The mint is not on that branch. Argent's own master moved the same day to `9a9f4b10`. That commit is the compiler. KCC-20 remains Draft.

Three jobs sit on that base:

- A meme is a name, a fixed allowance, and a public mint. `stp trump2028` is that.
- A utility puts extra meaning in the extension: a flag, a right, a freeze. The standard transfer copies the extension and does not read it. A custom entrypoint is what would read it.
- A stable needs a redeem path that pays KAS back to a holder. The KUSDT lab's `KusdtLock` is a teaching form of that redeem. This mint has no redeem. There is no spendable L1 stable in the Draft.

KRC-20 is a different, older protocol. Kasplex inscribes a JSON payload into a UTXO. An indexer, not the consensus script, decides who owns the token. It went through a public mint wave in 2024.

The SilverScript book minter is also a different program. Its token state has four fields. This lab does not compile that example.

## Why

The reference mint is permissionless on purpose. The caller pays. The deposit owner does not sign a mint or a split. The owner signs only to take the KAS deposit back, and only after the allowance is zero. That is how a crowd can mint a meme without the issuer touching each transaction. It is also how a crowd can fill blocks.

The 2024 KRC-20 beta showed the block-filling path. Kaspa-ng's integration note records it. Wallet software sent 0.2 KAS outputs. Under KIP-9 those outputs carried about 25,000 grams of storage mass. A block holds 500,000 grams, so about 20 such transactions fit. The protocol fee was 1 KAS, which is 4,000 sompi per gram. Ordinary transactions were around 1 to 4 sompi per gram. The mempool peaked near 37,000. Miners weigh fee divided by mass. The mint wave outranked everyone else, and most wallets could not raise the fee.

The knob on a KCC public mint is the per-mint limit, plus how small the KAS output is. A high limit finishes a supply in few transactions. A limit of one base unit turns the same supply into millions of transactions. A thin KAS output makes each of those transactions heavy. A high fee ratio makes each of them jump the queue.

## How

The rules below are the reference rules, run in `src/mint.mjs`. This is not the Argent virtual machine. Eleven tests check them. `npm test` reruns the checks. `npm run storm` prints the numbers.

Genesis is one minter. `remaining` is 20,280,000. `mint_amount` is 135,200. The extension commitment is unkeyed BLAKE3 of the UTF-8 bytes `stp trump2028`:

```text
379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706
```

BLAKE3 of the empty input matches the known vector `af1349b9…1f3262`, so the hash function is the real one. KCC-1 calls this hash `Hash`. The commitment is the token identity. A mint with any other commitment is rejected.

A mint must be a positive amount, at most 135,200, and at most the minter's remaining allowance. The caller chooses the recipient. The minter's KAS deposit is recreated at the same value. The fee is extra sompi from the caller. It is not skimmed from the deposit.

A split moves a positive amount of at most half the remaining allowance, using integer division, into a second minter. Both keep the same per-mint limit and the same extension. Getting to 150 minters takes 149 splits. Done as a tree, that is 8 rounds of parallel splits, of sizes 1, 2, 4, 8, 16, 32, 64, and 22. The last round is 22 because 106 of the 128 intermediate minters are already at one leaf. Each leaf then mints 135,200 once. Issued supply is 20,280,000 and every leaf remaining is zero. The deposit-reclaim gate opens only at zero. This lab does not build a signature.

The reference also wants a `TokenSeed` in the genesis group, so later callers can create zero-token receivers. A seed does not mint supply. This run does not execute the seed. A second genesis transaction would be a different covenant id. The lab uses one family.

The 150 callers are labels `mint-001` through `mint-150`. They are not Kaspa addresses and they are not keys. Their fee ratios are 50, 75, 100, and so on up to 3,775 sompi per gram. All 150 ratios differ. An ordinary transaction at 4 sompi per gram is included in the packing.

Storage mass uses the integer formula in rusty-kaspa `calc_storage_mass`, with `C = 10^12`. Plurality is 1 in these shapes. The node charges the greater of compute mass and storage mass. Compute mass for a real covenant script was not measured here.

| Shape | KAS on the new token output | Storage mass | Fits in one 500,000-gram block | Blocks for 150 mints plus the ordinary tx |
| --- | --- | ---: | ---: | ---: |
| Thin, 0.2 KAS output, 1 KAS fee | 0.2 | 57,500 | 8 | 19 |
| One KAS output, 1 KAS fee | 1 | 17,614 | 28 | 6 |
| Fat, 100 KAS output | 100 | 153 | 3,267 | 1 |
| Cited KRC-20 beta mass |  | 25,000 | 20 | 8 |
| Plain 1-in-1-out compute mass |  | 1,624 | 307 | 1 |

The thin inputs are a 1 KAS minter deposit and a 10 KAS caller input. The outputs are the 1 KAS deposit, a 0.2 KAS carrier, and 8.8 KAS change, with a 1 KAS fee. `mint-150` at 3,775 sompi/gram is first. On the thin shape the ordinary 4 sompi/gram transaction is not in the first block. On the fat shape the whole swarm and the ordinary transaction fit in one block.

One unsplit minter can be spent once. One hundred and fifty callers racing that single output confirm across 150 blocks. At 10 blocks per second that is 15 seconds. The losers conflict with the winner. They do not all add mass in the same block. This lab does not model how a node stores those losers.

The wide storm is the other setting of the same supply. If the per-mint limit is 1, the supply is 20,280,000 transactions. At the cited 25,000 grams, 20 fit in a block. That is 281.67 hours at 1 block per second, and 28.17 hours at 10 blocks per second, if every block is full of those mints. The 2024 backlog of about 37,000 transactions, at about 20 per block and 1 block per second, is 1,850 blocks. That is about 31 minutes of full blocks before counting the mints that kept arriving.

This token is aimed at the small side of that range: 149 splits and 150 mints. With thin outputs the packing is 19 blocks, under two seconds at 10 blocks per second. The congestion in a later meme wave would come from a small per-mint limit, thin KAS outputs, and fee ratios above ordinary traffic.

## Conclusion

`stp trump2028` can be minted under the rules in the open reference, on this machine, with a hard supply of 20,280,000. It cannot be minted on Kaspa today. KCC-20 is Draft, the mint chapter is not in that Draft, and the reference master branch does not contain the app.

A meme is this shape: a name, a cap, and a crowd of callers. A utility still needs an entrypoint that reads the extension. A stable still needs a redeem that pays KAS back. Those are two further programs.

One hundred and fifty thin mints are a few seconds at 10 blocks per second. They are not the 2024 backlog. The backlog comes back if the per-mint limit is small and each mint carries a thin KAS output at a fee ratio above ordinary traffic. One shared minter does the opposite: the callers conflict, and only one mint confirms per block.

The mass table uses plurality 1 and ignores covenant script size. A compiled script can be heavier than every row here. Until that script is measured, the table is a model.

## What I would test

These eleven checks already pass in `test/lab.test.mjs`: the name hash, the supply cap, mint rejections, the half split, reclaim only at zero, 150 distinct fee ratios, one mint per leaf, storage-mass arithmetic, and fee-ratio packing.

The next tests, in the order that would change the conclusion:

1. Run the reference itself. At `8c8dc8ee`, `cargo test --locked --all-targets` and `cargo run --locked --bin kcc20 -- mint`. A pass means the Argent machine agrees with this write-up. This folder would then stay a packing model.
2. Compile `public_mint.ag` and measure the script public key. Plurality is the storage bytes divided into 100-byte units, and the covenant id adds 32 bytes. Plurality is squared in the mass formula. A plurality of 4 or more can push one thin output over the 500,000-gram block. That measurement replaces the table.
3. Submit one covenant transaction to a local Testnet-10 node: one genesis minter, one mint, and a second mint of the same output. The node should accept the first, reject an over-mint, and confirm only one spend. Public mempools stay out of it. One hundred and fifty submissions are a different experiment.
4. Ask the node how it orders the 150 ratios. Selection is weighted by fee divided by mass. The strict sort in this lab is the ranking, not the sampler. The question is whether 50 sompi per gram still beats 4, and whether 3,775 always lands first.
5. Walk the integer edges the reference names: a total at `2^63 - 1`, a half of 1, scheme byte `0x80`, and a reclaim signature that does not match the deposit owner.
6. Run `TokenSeed`. It should create a zero-token receiver and should not increase supply. A borrowed receive can then pay into that receiver.
7. A stable test is a separate program. Lock sompi, redeem the same sum to the holder, and pay the fee from another input. That is the KUSDT lock. It is not a setting of this mint.

## Run

```text
npm test
npm run storm
```

Node runs the tests. No compiler, no wallet, no node connection.

## Sources

- Draft KCC-20, kaspanet/kccs `411b41bc`, file `kcc-0020.md`. Status Draft, updated 2026-08-25. https://github.com/kaspanet/kccs/blob/411b41bc14b3fda8f3a0548242c555f3597cad1a/kcc-0020.md
- KCC-20 discussion link printed by that file: https://kas-smiths.org/t/fungible-token-covenant-specification-kcc20/8/
- Reference README, argent-lang/kcc20-reference pull head `72767847` (7 Oct 2026, 13:44Z). Master of that repo is still `76648f99` (10 Sep, "initial"). https://github.com/argent-lang/kcc20-reference/blob/72767847934bf7afe95efaf97bbad0028850a4f5/README.md
- Reference mint, parent `8c8dc8ee`, `contracts/public_mint.ag`. https://github.com/argent-lang/kcc20-reference/blob/8c8dc8eeff73482ea7b3144e42c92bbf2a25068f/contracts/public_mint.ag
- KRC-20 beta mass, fee, and mempool: https://github.com/kaspa-ng/kaspa-ecosystem-updates/blob/main/README.md
- Kasplex as the third-party indexer protocol: https://wiki.kaspa.org/en/Kasplex_KRC_20 and https://kaspa.org/kasplex-faq/
- Storage-mass code used for the integers: rusty-kaspa `consensus/core/src/mass/mod.rs`, function `calc_storage_mass`, desk clone `dc2b59f3`. The constant `C` is `SOMPI_PER_KASPA * 10_000`.
- The 1,624-gram line is compute mass for a standard version-0, 1-input 1-output, empty-payload Schnorr transaction, measured on this desk. A 500,000-gram block holds 307 of them. It is a comparison line. It is not the storage mass of this mint.
- KUSDT redeem lab, separate from this mint: https://github.com/STP-KAS/kusdt-split

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
