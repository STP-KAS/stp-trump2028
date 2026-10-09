> **Experimental. Not advice.**
>
> A public-mint lab under the KCC-20 Last Call text. Not money. Not a dollar. Not Kaspa core.
> [DISCLAIMER.md](DISCLAIMER.md)

# stp trump2028

## Goal

Mint one named token, under the KCC-20 Last Call rules, until 5,000 different addresses hold the whole supply.

The name is `stp trump2028`. The supply is 20,280,000 base units. One mint may take at most 4,056. Five thousand mints finish the allowance. The launch path is `launch::stp-trump2028-last-call`. The numbers are in [TOKENOMICS.md](TOKENOMICS.md). The two runners that do the broadcast are [PROMPT-BUILD.md](PROMPT-BUILD.md) and [PROMPT-BOT.md](PROMPT-BOT.md). They write what they saw under [map/](map/).

## What

KCC means Kaspa Covenant Convention. KCC-20 is the fungible-token covenant. On kaspanet/kccs commit `3fbec524` the status line is Last Call. Last Call is the last review window in KCC-0. That header sets no Last-Call-Deadline. The status is not Final. KCC-1 and KCC-2 are Last Call on the same commit. KCC-0 is Final.

The state fields, in order, are amount, owner, owner scheme, borrow scheme, borrow guard, and extension commitment. A transfer keeps the sum of the amounts. Inside one covenant family, the same extension commitment is what makes two states fungible. Two launch paths with that same digest are two covenant ids.

The extension is unkeyed BLAKE3 of the UTF-8 bytes `stp trump2028`:

```text
379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706
```

BLAKE3 of the empty input matches the known vector `af1349b9…1f3262`. The name text is not stored again beside that digest.

Issuance lives in the reference app `KCC20PublicMint`, argent-lang/kcc20-reference commit `c8a08711`, file `contracts/public_mint.ag`. A mint is permissionless. The caller picks the recipient, the amount, and the recipient's schemes. The amount has to be positive, at most the per-mint limit, and at most the remaining allowance. The minter's KAS deposit is recreated at the same value. The fee is extra sompi from the caller.

A split moves a positive amount of at most half the remaining allowance into a second minter. The caller chooses that minter's deposit owner and funds its deposit. Getting to 5,000 minters takes 4,999 splits. The rounds are 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, and 904. Each leaf then mints 4,056 once. Issued supply is 20,280,000 and every leaf remaining is zero. The deposit comes back only at zero, and only to that minter's owner.

The genesis group also carries one `TokenSeed` with the same extension. A seed creates a zero-token receiver. It does not mint supply. A seed added in a later transaction would be a different covenant id. This plan puts the minter and the seed in one genesis group.

The recipient owner scheme is `0x00`, p2pk-schnorr, so the owner field is the public key. The borrow scheme is `0x00`, disabled, so a stranger cannot borrow the outpoint. There is no premine. The covenant stores no ticker and no decimals.

On 7 Oct 2026 a local testnet-10 node accepted a different launch: path `launch::stp-trump2028`, limit 135,200, one mint, covenant id `9631239207025d6ec0cfc59095bc345f20a9de63967db2ea0f60af826c0798e8`. The signing key was discarded. That family is stuck with 20,144,800 unminted. It is not this launch. The log is [LIVE.md](LIVE.md).

The Last Call text closed the old decrease-on-a-negative-threshold hole by clamping the threshold at zero. A negative payload still allows a one-unit increase. The notes are in [FINDINGS.md](FINDINGS.md).

## Why

The reference mint is permissionless so a crowd can issue a fixed supply without the deposit owner signing each transaction. The owner signs only to take the KAS deposit back, after that minter's allowance is zero. The same shape is how a crowd fills blocks.

The 2024 KRC-20 beta showed the block-filling path. Wallet software sent 0.2 KAS outputs. Under KIP-9 those outputs carried about 25,000 grams of storage mass. A block holds 500,000 grams, so about 20 such transactions fit. Miners weigh fee divided by mass, cubed. The mint wave outranked ordinary traffic.

The knob on this mint is the per-mint limit, plus how much KAS sits on the new token output. A limit of 4,056 finishes 20,280,000 in 5,000 transactions. A limit of 1 turns the same supply into 20,280,000 transactions, about 281.67 hours of full blocks at 1 block per second, or 28.17 hours at 10, at the cited 25,000 grams. This token uses the short setting. The live carrier is 1 KAS, not the thin 0.2 KAS shape.

Five thousand addresses is the whole holder set. Each one is a fresh random key. Each one receives 4,056 once. The model labels them `mint-0001` through `mint-5000`. Those labels are not Kaspa addresses. The broadcast generates real keys and keeps them off this GitHub.

## How

`src/mint.mjs` is the allowance model. It is not the Argent virtual machine. `npm test` runs fifteen checks. `npm run storm` prints the packing. No compiler, no wallet, and no node connection.

The 5,000 fee ratios in the model run from 50 through 5,049 sompi per gram, one apart. An ordinary transaction at 4 sompi per gram is in the packing. The node weight is the ratio cubed. The highest mint holds about 0.08 percent of that weight, so it is not certain to be drawn first. A ratio of 50 outweighs a ratio of 4 by 1,953 times. In 4,000 draws the ordinary transaction was drawn first zero times.

Storage mass uses the integer formula in rusty-kaspa `calc_storage_mass`. A covenant output is a 35-byte pay-to-script-hash plus a covenant id, plurality 2. Plurality 4 on the thin shape still weighs 938,411 grams, over one block.

| Shape | KAS on the new token output | Storage mass | Fits in one 500,000-gram block | Blocks for 5,000 mints plus one ordinary tx |
| --- | --- | ---: | ---: | ---: |
| Thin, 0.2 KAS output, 1 KAS fee | 0.2 | 232,955 | 2 | 2,501 |
| One KAS output, 1 KAS fee | 1 | 73,069 | 6 | 834 |
| Fat, 100 KAS output | 100 | 653 | 765 | 7 |
| Cited KRC-20 beta mass |  | 25,000 | 20 | 251 |
| Plain 1-in-1-out compute mass |  | 1,624 | 307 | 17 |

The one-kas row is the shape the prompts submit. The thin row is the shape that fills a block fastest. One unsplit minter confirms one mint at a time. Five thousand serial spends of one output are 500 seconds at 10 blocks per second. The split tree is what lets the mints stop waiting on one outpoint.

The broadcast is split across two runners so they do not launch two families.

- Grok Build launches the genesis, splits to 5,000 leaves, and mints the even indexes. It writes `map/build/`.
- Grok Bot does not launch. It mints the odd indexes from the published leaves and writes `map/bot/`.
- A note that helps the sixpack square goes in a new file under `map/1984/`. The square mint is a ledger. This mint is a covenant. The page that says so is [map/1984/README.md](map/1984/README.md).

This paste does not start the desk storm. It does not move miners, and it does not open a tunnel.

## What was already tested

The 7 Oct log is [RESULTS.md](RESULTS.md). The machine swarm of 150 callers is [SWARM.md](SWARM.md). Both used the older limit and the older reference commit. The fifteen checks in this folder now lock the 5,000-leaf allowance, the Last Call borrow clamp, and the packing table above.

## Run

```text
npm test
npm run storm
```

## Sources

- Last Call KCC-20, kaspanet/kccs `3fbec524`, file `kcc-0020.md`. https://github.com/kaspanet/kccs/blob/3fbec524/kcc-0020.md
- KCC-20 discussion link printed by that file: https://kas-smiths.org/t/fungible-token-covenant-specification-kcc20/8/
- Reference, argent-lang/kcc20-reference `c8a08711`. https://github.com/argent-lang/kcc20-reference/blob/c8a08711/contracts/public_mint.ag
- KRC-20 beta mass, fee, and mempool: https://github.com/kaspa-ng/kaspa-ecosystem-updates/blob/main/README.md
- Storage-mass code: rusty-kaspa `consensus/core/src/mass/mod.rs`, function `calc_storage_mass`. The constant `C` is `SOMPI_PER_KASPA * 10_000`.
- The 1,624-gram line is compute mass for a standard version-0, 1-input 1-output, empty-payload Schnorr transaction, measured on this desk.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
