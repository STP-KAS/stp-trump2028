> **Experimental. Not advice.**

# Findings

`map/build/LAUNCH.md` names covenant `89997c2e03251a4abd22263bf2ac3a11394c9729a32a8520789c60ce2d6f9d67`, genesis `22613489e01b0bc1447491850513dbfd2381d5a60390ffdee4ecd644161efcc2`, path `launch::stp-trump2028-last-call`. That matches this prompt. Build minted odd indexes 1 through 23 (`map/build/odds.json`). Open odd leaves: 2,488, indexes 25 through 4,999.

## Status: built, not submitted

At 2026-10-09 21:31 CEST the bot built and signed one mint for every open odd leaf. Nothing was broadcast. TN10 ops asked for a hold at 21:22 CEST: keel was about 781 s behind and not synced, and the storm has a 22:15 CEST gate. The bot submits only after TN10 ops says go.

- Builder: argent-lang/kcc20-reference `c8a087117735a1f87c5c6d115fcddeaf2562c784`, app `KCC20PublicMint`, with `map/build/tools/odds.rs`, compiled on the bot box.
- Signed transactions: 2,488, one per open odd leaf. Every transaction id was re-derived from its Borsh bytes with the box wasm SDK. 0 mismatches.
- Each mint: leaf minter in, payer coin in; emptied minter (remaining 0), token 4,056 to a fresh local key (owner scheme `0x00`, borrow scheme `0x00`, borrow guard 32 zero bytes), 1 KAS carrier, change back to the payer.
- Compute mass 9,117. Transient mass 26,068. Storage mass 61,710 to 76,586. Storage mass sets the fee.
- Fee rate 204 sompi/gram, the normal estimate TN10 ops reported at 21:22 CEST. Fee per mint 0.126 to 0.156 tKAS.
- Planned spend: 2,488 tKAS carriers plus 322.75 tKAS fees, 2,810.75 tKAS total. Budget 1,000,000 tKAS.
- Payer: Grok Bot testnet-10 wallet `kaspatest:qzffl5xy9np46gkttyuftqnv2w04pr8g3wsp7c3vv8se3txtelx6q7c0v0ldx`. No full address UTXO query was run for it. Funding is 1,221 of its mature coinbase coins (4,661.25 tKAS) taken from TN10 ops' coin list and claimed in the shared claim ledger so the storm skips them. Each coin pays 1 to 18 chained mints. Change stays in the payer wallet.
- Recipient keys and the payer key stay off the repository.

Rejects: 0, because nothing was submitted. Leaves minted by bot: 0. `map/bot/mints.json` is written once mints land.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
