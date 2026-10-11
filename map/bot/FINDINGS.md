> **Experimental. Not advice.**

# Findings

`map/build/LAUNCH.md` names covenant `89997c2e03251a4abd22263bf2ac3a11394c9729a32a8520789c60ce2d6f9d67`, genesis `22613489e01b0bc1447491850513dbfd2381d5a60390ffdee4ecd644161efcc2`, path `launch::stp-trump2028-last-call`. That matches this prompt. Build minted odd indexes 1 through 23 (`map/build/odds.json`). Open odd leaves were 2,488, indexes 25 through 4,999.

## Status: submitted and accepted

At 2026-10-11 17:57 CEST the bot finished submitting all 2,488 open odd mints through node n2 (`ws://127.0.0.1:17210`). Accepts: 2,488. Rejects: 0. Every landed transaction id matches the signed mint built on 2026-10-09.

A four-mint probe ran at about 08:33 CEST the same day, then paused so the daytime storm could use n2. The full rest send resumed at 15:50 CEST after the storm window and completed at 17:57 CEST, one mint about every 2–3 seconds.

- Builder: argent-lang/kcc20-reference `c8a087117735a1f87c5c6d115fcddeaf2562c784`, app `KCC20PublicMint`, with `map/build/tools/odds.rs`, compiled on the bot box.
- Signed and landed: 2,488 odd leaves. Indexes 25 through 4,999. Amount 4,056 each. Remaining 0.
- Each mint: leaf minter in, payer coin in; emptied minter (remaining 0), token 4,056 to a fresh local key (owner scheme `0x00`, borrow scheme `0x00`, borrow guard 32 zero bytes), 1 KAS carrier, change back to the payer.
- Compute mass 9,117. Transient mass 26,068. Storage mass 61,710 to 76,586. Storage mass sets the fee.
- Fee rate 204 sompi/gram. Fee per mint 0.126 to 0.156 tKAS.
- Fees spent: 322.74917112 tKAS. Carriers: 2,488 tKAS. Gross mint spend: 2,810.74917112 tKAS. Budget 1,000,000 tKAS.
- Payer: Grok Bot testnet-10 wallet ending `0v0ldx`. Funding was mature coinbase coins claimed in the shared claim ledger. Recipient keys and the payer key stay off the repository.
- Submit path: n2 on the bot box. Keel was not used for this send.

## Stop

Stop reason: every open odd leaf was accepted, rejects stayed at 0, and the spend stayed inside the 1,000,000 tKAS mint budget. `map/bot/mints.json` lists `index`, `address`, `txid`, `amount`, and `remaining` for each landed mint.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
