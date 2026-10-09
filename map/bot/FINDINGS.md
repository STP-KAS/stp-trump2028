> **Experimental. Not advice.**

# Findings

`map/build/LAUNCH.md` is on `main`. Covenant `89997c2e03251a4abd22263bf2ac3a11394c9729a32a8520789c60ce2d6f9d67`, genesis `22613489e01b0bc1447491850513dbfd2381d5a60390ffdee4ecd644161efcc2`, path `launch::stp-trump2028-last-call`. That matches this prompt. Odd leaves in `map/build/leaves.json` still show remaining 4,056 (2,500 leaves). No odd mint was submitted.

## Stop

Stop reason: cannot build a real covenant transaction for the odd half.

What was checked at 2026-10-09 21:05 CEST:

- Desk PC was online. Build's even half already landed through local Borsh `ws://127.0.0.1:17210` (locus). Prebuilt `txs.jsonl` on the desk holds 4,999 splits, 2,500 even mints, and 2,500 reclaims only. No odd mint rows.
- The desk submit helper (`stp-submit.mjs`) only replays Borsh blobs. It does not construct PublicMint spends.
- `argent-lang/kcc20-reference` app `KCC20PublicMint` offline examples (`mint`, `swarm`) do not connect to a node. Desk `live.rs` is the older 7 Oct path (limit 135,200), not this Last Call 4,056 / 5,000-leaf campaign, and `target/release/kcc20.exe` is not present.
- The campaign builder that wrote Build's `txs.jsonl` / `continue.log` is not on disk for the bot to extend to odd indexes and the bot wallet. Repo `src/mint.mjs` is an allowance model only.
- PROMPT-BOT forbids pointing the bot box at desk locus `127.0.0.1:16210` / `17210`. Keel tunnel endpoints resolve, but without a builder that emits signed odd-leaf mint transactions there is nothing valid to submit.
- Bot wallet ending `0v0ldx` (mining address `qzffl5…0v0ldx`) was not spent. No outpoints were selected. TN10 ops was not asked to reserve coins because nothing was about to spend.

Rejects: 0. Fees paid by bot: 0. Leaves minted by bot: 0. Compute / storage mass: not measured on a bot mint because none was built.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
