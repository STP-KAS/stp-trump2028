# Prompt for Grok Build

Paste this to Grok Build. This paste mints the lab token. It does not start the desk storm. It does not move miners. It does not open a tunnel. It does not stop or start kaspad.

You are Grok Build. Clone https://github.com/STP-KAS/stp-trump2028 and read README.md, TOKENOMICS.md, DISCLAIMER.md, and map/README.md before you spend anything.

## Goal

Finish one KCC-20 public mint on testnet-10. Supply 20,280,000. Five thousand fresh random addresses. Each receives 4,056 once. When you stop, every minter remaining is 0, or you have written why it is not.

## What you own

You launch. You split. You mint the even leaf indexes: 0, 2, 4, and so on. Grok Bot mints the odd indexes. If Bot has published nothing and the odd leaves are still open after your even leaves are done, you may finish the odd leaves too. Write that you did.

If `map/build/LAUNCH.md` already records a covenant id, do not launch again. Continue that family.

## Rules that do not move

- Testnet-10 only. Do not use a mainnet RPC, a mainnet address, or a mainnet key.
- Submit through a testnet-10 node this runner already uses. Do not start kaspad. Do not retarget a miner. Do not fund keel. Do not touch the storm wallets for this mint.
- Pay from the Grok Build testnet-10 wallet this runner already uses. The public address ends in `wurqhd`. Do not spend the Grok Bot wallet. Do not spend the sixpack guest pool. Do not spend the discarded 7 Oct key. You do not have it.
- This runner's mint budget is 1,000,000 tKAS. The bot's mint budget is 1,000,000 tKAS on the bot wallet. Do not send more than 1,000,000 tKAS to any one address. The carrier stays 1 KAS. Stop before the next deposit, carrier, and fee would pass your budget.
- Do not comment on kaspanet/kccs, argent-lang/kcc20-reference, Manyfestation/kcc20-reference, or any other upstream repository. Do not open a pull request on them.
- The code you compile is argent-lang/kcc20-reference commit `c8a08711`, app `KCC20PublicMint`. The text you follow is kaspanet/kccs `3fbec524`, file `kcc-0020.md`, status Last Call. Do not use kcc20-live, KaspaKaha, or the SilverScript four-field minter.
- If you cannot build a real covenant transaction, stop and write that in `map/build/FINDINGS.md`. Do not write a square-ledger line, a KRC-20 inscription, or a note in place of the mint.

## Token

Use [TOKENOMICS.md](TOKENOMICS.md) as written.

- Name `stp trump2028`.
- Extension `379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706`.
- Launch path `launch::stp-trump2028-last-call`. A bare path is rejected. The old path `launch::stp-trump2028` is the stuck family. Leave covenant `9631239207025d6ec0cfc59095bc345f20a9de63967db2ea0f60af826c0798e8` alone.
- Genesis group: one `PublicMint` with remaining 20,280,000 and mint amount 4,056, and one `TokenSeed` with the same extension. No token balance in that group.
- Owner scheme `0x00`. Borrow scheme `0x00`. Borrow guard 32 zero bytes.
- Minter deposit 1 KAS. Token carrier 1 KAS. Pay the node's ordinary fee estimate for the mass you built. Do not multiply the fee by 87. That factor belongs to the sixpack page.
- Split until there are 5,000 leaves. The model's rounds are 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 904. A take is at most half the remaining allowance.
- Each even leaf mints 4,056 to a new random key. The recipient does not need tKAS. Your wallet pays the carrier and the fee. The owner field is that key's Schnorr public key.
- After a leaf remaining is 0, reclaim its deposit back to the deposit owner.

Generate the keys on this machine. Keep them outside the repository. `keys/`, `secrets/`, `*.key`, and `*.seed` are gitignored. Never print a private key into a file you commit, a log you commit, or the chat summary you push.

## What you write

Commit only under `map/build/` and, when you learn something the square can use, a new file under `map/1984/`. Do not edit `map/1984/README.md`. Do not edit `map/bot/`.

- `map/build/LAUNCH.md` with the covenant id, genesis txid, launch path, extension, supply, per-mint limit, seed outpoint, and first minter outpoint.
- `map/build/MINTS-COUNTS.md` with counts only (leaves, remaining per parity, mints landed, tokens). Leaf rows, outpoints, addresses and txids stay on the desk, never in git.
- `map/build/FINDINGS.md` with compute mass, storage mass, fee paid, rejects, and the stop reason.

Pull, rebase, and push to `origin/main`. Author the commit as STP-KAS with `227352643+STP-KAS@users.noreply.github.com`. One sentence. Do not force-push. If the wallet cannot cover the next deposit, carrier, and fee, stop and write the balances you are willing to show. Public addresses and amounts are fine. Keys are not.

A reject of one leaf is a row in FINDINGS. Continue with the next leaf you own. Stop after 20 rejects in a row and describe the pattern.

## 1984

The square mint on sixpack is a ledger book, not this covenant. If a result would change how that page should list holders, fees, or borrow, add `map/1984/` plus a new markdown file named with the date and `build`. The existing note is `map/1984/README.md`.

Si vis pacem, para bellum.
