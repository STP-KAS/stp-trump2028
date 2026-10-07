> **Experimental. Not advice.**
>
> Local proof of a limited public mint. Not money. Not a dollar. Not Kaspa core.
> [DISCLAIMER.md](DISCLAIMER.md)

# stp trump2028

## Goal

Mint one named token with a hard supply under today's KCC rules, and see how a crowd of those mints would sit in a block.

The name is `stp trump2028`. The supply is 20,280,000 base units. One mint may take at most 135,200. The crowd in the model is 150 callers, each with a different fee ratio. The network test is one genesis and one mint on a local testnet-10 node. The files in this folder do not connect to a node. The submit is [LIVE.md](LIVE.md).

## What

On 7 Oct 2026 that node accepted the genesis and the mint. A second mint of the same minter output was rejected. A later read still found both accepted transactions on the selected chain, at virtual DAA score 590,565,584. The mint's accepting block is at DAA 590,545,177.

The issued lot is 135,200. The allowance left on the minter is 20,144,800. The node reports compute mass 8,706 and storage mass 17,520 for the mint. The covenant script in that transaction carries the extension, the supply, and the lot. The name text is not in the script. Both covenant outputs use covenant id `9631239207025d6ec0cfc59095bc345f20a9de63967db2ea0f60af826c0798e8`.

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

The rules below are the reference rules, run in `src/mint.mjs`. This is not the Argent virtual machine. Fourteen tests check the model, including the fee the accepted mint actually paid. `npm test` reruns them. `npm run storm` prints the numbers. The Argent run and the KUSDT redeem run are in [RESULTS.md](RESULTS.md).

Genesis is one minter. `remaining` is 20,280,000. `mint_amount` is 135,200. The extension commitment is unkeyed BLAKE3 of the UTF-8 bytes `stp trump2028`:

```text
379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706
```

BLAKE3 of the empty input matches the known vector `af1349b9…1f3262`, so the hash function is the real one. KCC-1 calls this hash `Hash`. The commitment is the token identity. A mint with any other commitment is rejected.

A mint must be a positive amount, at most 135,200, and at most the minter's remaining allowance. The caller chooses the recipient. The minter's KAS deposit is recreated at the same value. The fee is extra sompi from the caller. It is not skimmed from the deposit.

A split moves a positive amount of at most half the remaining allowance, using integer division, into a second minter. Both keep the same per-mint limit and the same extension. Getting to 150 minters takes 149 splits. Done as a tree, that is 8 rounds of parallel splits, of sizes 1, 2, 4, 8, 16, 32, 64, and 22. The last round is 22 because 106 of the 128 intermediate minters are already at one leaf. Each leaf then mints 135,200 once. Issued supply is 20,280,000 and every leaf remaining is zero. The deposit-reclaim gate opens only at zero. This lab does not build a signature.

The reference also wants a `TokenSeed` in the genesis group, so later callers can create zero-token receivers. A seed does not mint supply. This run does not execute the seed. A second genesis transaction would be a different covenant id. The lab uses one family.

The 150 callers are labels `mint-001` through `mint-150`. They are not Kaspa addresses and they are not keys. Their fee ratios are 50, 75, 100, and so on up to 3,775 sompi per gram. All 150 ratios differ. An ordinary transaction at 4 sompi per gram is included in the packing.

Storage mass uses the integer formula in rusty-kaspa `calc_storage_mass`, with `C = 10^12`. Plurality is 1 in these shapes. A version-1 relay fee uses the greater of compute mass and half the transient mass, rounded up. Storage mass is a separate commitment. The local testnet mint measured both, in [LIVE.md](LIVE.md).

A covenant output is a 35-byte pay-to-script-hash plus a covenant id. Its storage plurality is 2. The rows below use that plurality. A plurality of 4 on the same thin shape weighs 938,411 grams, which is over one block.

| Shape | KAS on the new token output | Storage mass | Fits in one 500,000-gram block | Blocks for 150 mints plus the ordinary tx |
| --- | --- | ---: | ---: | ---: |
| Thin, 0.2 KAS output, 1 KAS fee | 0.2 | 232,955 | 2 | 76 |
| One KAS output, 1 KAS fee | 1 | 73,069 | 6 | 26 |
| Fat, 100 KAS output | 100 | 653 | 765 | 1 |
| Cited KRC-20 beta mass |  | 25,000 | 20 | 8 |
| Plain 1-in-1-out compute mass |  | 1,624 | 307 | 1 |

The thin inputs are a 1 KAS minter deposit and a 10 KAS caller input. The outputs are the 1 KAS deposit, a 0.2 KAS carrier, and 8.8 KAS change, with a 1 KAS fee. The deposit and the carrier are covenant outputs. The caller input and the change are ordinary outputs. `mint-150` ranks first in a strict sort. On the thin shape the ordinary 4 sompi/gram transaction is not in the first block. On the fat shape the whole swarm and the ordinary transaction fit in one block. At 10 blocks per second the thin packing is 76 blocks, 7.6 seconds.

The node does not use that strict sort. Its mempool weight is the fee ratio cubed. `mint-150` at 3,775 carries about 2.6 percent of the swarm's weight, so it is not certain to be drawn first. A ratio of 50 weighs 1,953 times a ratio of 4. In 4,000 draws the ordinary transaction was drawn first zero times.

One unsplit minter can be spent once. One hundred and fifty callers racing that single output confirm across 150 blocks. At 10 blocks per second that is 15 seconds. The losers conflict with the winner. They do not all add mass in the same block. This lab does not model how a node stores those losers.

The wide storm is the other setting of the same supply. If the per-mint limit is 1, the supply is 20,280,000 transactions. At the cited 25,000 grams, 20 fit in a block. That is 281.67 hours at 1 block per second, and 28.17 hours at 10 blocks per second, if every block is full of those mints. The 2024 backlog of about 37,000 transactions, at about 20 per block and 1 block per second, is 1,850 blocks. That is about 31 minutes of full blocks before counting the mints that kept arriving.

This token is aimed at the small side of that range: 149 splits and 150 mints. With thin covenant outputs the packing is 76 blocks, 7.6 seconds at 10 blocks per second. The congestion in a later meme wave would come from a small per-mint limit, thin KAS outputs, and fee ratios above ordinary traffic.

## Conclusion

The local testnet-10 node accepted a version-1 covenant genesis and one mint, and a later read still had both on the selected chain. The second mint of that same output was rejected and is not in a block. The fee that paid for the mint is 5,172,800 sompi. That is half the transient mass, times 400 sompi per gram. Storage mass on this mint is 17,520, which is above that relay mass, and the node accepted the fee anyway. Storage mass was checked. It did not set the price.

The submitted token output holds about 5.19 tKAS. The thin row in the table above, 232,955 grams, is the shape that fills a block. It is not the shape that was sent. One hundred and fifty callers were accepted by the reference machine. They were not sent to the node. One shared minter confirms one mint. The next spend of that output conflicts.

KCC-20 remains Draft. The mint app is the open reference at `8c8dc8ee`, not the reference master, and not a chapter of the Draft. This is not a mainnet token. The signing key was discarded, so the remaining 20,144,800 cannot be minted from this repository. A meme is a name, a cap, and a crowd of callers. A utility still needs an entrypoint that reads the extension. A stable is a separate redeem. The KUSDT lock is that redeem, in another lab.

## Swarm run

On 7 Oct 2026 the reference machine at `8c8dc8ee` minted this token. One genesis, 149 splits, and 150 caller mints. Issued supply 20,280,000. The 150 mints do not share a minter output, so each one is accepted without waiting for the others. Two mints of the same output both pass the script and spend one outpoint. A further mint after zero is rejected. The engine spent 302 ms on the 150 mints. Those virtual-machine ids were not sent to a node. The log is [SWARM.md](SWARM.md). The separate network mint is one lot, in [LIVE.md](LIVE.md).

## What was tested

Details and the commands are in [RESULTS.md](RESULTS.md).

1. Reference suite at `8c8dc8ee`: `cargo test --locked --all-targets` passed 54 tests. `cargo run --locked --bin kcc20 -- mint` exited 0 and minted the example allowance down to zero. Those ids are virtual-machine ids.
2. Script public key: 35 bytes, plurality 2. Compiled bytecode is 2,019 bytes for PublicMint, 4,031 for KCC20, and 1,355 for TokenSeed. Plurality 4 on the thin shape is 938,411 grams.
3. Local testnet-10. One genesis and one mint of 135,200 were accepted. A second mint of the same minter output was rejected as already spent in the mempool. A later read still found both on the selected chain, and the mint transaction carries the extension, the supply, and the lot. [LIVE.md](LIVE.md). The 150-caller machine run was not submitted. Public mempools were not used.
4. Mempool weight is `(fee / mass) ^ 3`. A ratio of 50 outweighs a ratio of 4 by 1,953 times. `mint-150` holds about 2.6 percent of the weight, so it does not always land first. In 4,000 seeded draws the ordinary transaction was never first.
5. Integer edges in this model: `2^63 - 1` mints to zero, one more is rejected, a half of 1 is rejected, scheme byte `0x80` is rejected, and a reclaim by the wrong owner is rejected. The reference suite also accepts `i64::MAX` and rejects a reclaim by the wrong key.
6. `TokenSeed` in the reference suite: a create of 1 token is rejected, a create of 0 is accepted, and a borrowed receive then pays into that receiver. The seed does not increase supply.
7. KUSDT lock: full redeem, fee on the second input, and rejections for a skim, a wrong recipient, and a wrong key. The guest tag still refuses to be spent as gas.

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
