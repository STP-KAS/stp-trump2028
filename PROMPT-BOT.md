# Prompt for Grok Bot

Paste this to Grok Bot. This paste mints the lab token. It does not start the desk storm. It does not move miners. It does not open a tunnel. It does not stop or start kaspad.

You are Grok Bot. Clone https://github.com/STP-KAS/stp-trump2028 and read README.md, TOKENOMICS.md, DISCLAIMER.md, and map/README.md before you spend anything.

## Goal

Finish the odd half of the KCC-20 public mint that Grok Build already launched on testnet-10. Supply 20,280,000. Five thousand fresh random addresses. Each receives 4,056 once. You mint the odd indexes while Build's even indexes are already submitted. You do not launch a second token.

## What you own

Grok Build launched, split, and minted the even leaf indexes. You mint the odd leaf indexes from `map/build/leaves.json`: 1, 3, 5, and so on. You mint them into the same covenant. You do not wait for a second launch.

The family in `map/build/LAUNCH.md` is covenant `89997c2e03251a4abd22263bf2ac3a11394c9729a32a8520789c60ce2d6f9d67`, genesis `22613489e01b0bc1447491850513dbfd2381d5a60390ffdee4ecd644161efcc2`. If that file names another covenant id, stop. Do not launch.

If `map/build/LAUNCH.md` is not on the branch, write `map/bot/WAITING.md` with the time and stop. Do not invent a launch path. Do not submit a genesis.

An odd leaf can be minted when its outpoint is in a block or already in the mempool. The split chain is serial. If the node does not know that outpoint yet, skip the leaf and come back. Do not split a new tree.

If Build has already minted an odd leaf, skip it. Leave every even index. `map/build/FINDINGS.md` says the even half was accepted. Do not mint those again.

## Rules that do not move

- Testnet-10 only. Do not use a mainnet RPC, a mainnet address, or a mainnet key.
- Pay from the Grok Bot testnet-10 wallet this runner already uses. The public address ends in `0v0ldx`. That is your only mint wallet. Do not spend the Grok Build wallet. Do not spend the sixpack guest pool. Do not spend the discarded 7 Oct key. You do not have it.
- Your mint budget is 1,000,000 tKAS on that wallet. Build's mint budget is 1,000,000 tKAS on the Build wallet. Build's even half is already inside its budget. Stop before the next carrier and fee would push your own mint spend over 1,000,000 tKAS.
- Do not send more than 1,000,000 tKAS to any one address. The token carrier is 1 KAS. Do not add tKAS to a recipient.
- Submit through a testnet-10 node this runner already uses. If that node cannot take the mint, use keel. On this desk, keel's Borsh socket is `ws://127.0.0.1:17310` and its gRPC port is `16310`. From the bot box, use the keel tunnel this runner already has. Do not point the bot box at desk locus `127.0.0.1:16210` or `127.0.0.1:17210`. Do not start kaspad. Do not stop kaspad. Do not retarget a miner. Do not fund keel. Do not open a new tunnel. Do not touch the storm.
- Do not comment on kaspanet/kccs, argent-lang/kcc20-reference, Manyfestation/kcc20-reference, or any other upstream repository. Do not open a pull request on them.
- The code you compile is argent-lang/kcc20-reference commit `c8a08711`, app `KCC20PublicMint`. The text you follow is kaspanet/kccs `3fbec524`, file `kcc-0020.md`, status Last Call. Do not use kcc20-live, KaspaKaha, or the SilverScript four-field minter.
- If you cannot build a real covenant transaction, stop and write that in `map/bot/FINDINGS.md`. Do not write a square-ledger line, a KRC-20 inscription, or a note in place of the mint.

## Token

Use the family in `map/build/LAUNCH.md`. The plan, if Build followed it, is [TOKENOMICS.md](TOKENOMICS.md).

- Name `stp trump2028`.
- Extension `379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706`.
- Launch path `launch::stp-trump2028-last-call`. Refuse any other path, including `launch::stp-trump2028`.
- Each odd leaf mints 4,056 to a new random key. Owner scheme `0x00`. Borrow scheme `0x00`. Borrow guard 32 zero bytes.
- Token carrier 1 KAS. Pay the node's ordinary fee estimate for the mass you built. Do not multiply the fee by 87.
- The recipient does not need tKAS. Your wallet pays the carrier and the fee. The owner field is that key's Schnorr public key.
- Do not split a new tree. Do not reclaim a deposit unless you are the deposit owner named on that leaf. Build funded the deposits.

Generate the keys on this machine. Keep them outside the repository. `keys/`, `secrets/`, `*.key`, and `*.seed` are gitignored. Never print a private key into a file you commit, a log you commit, or the chat summary you push.

## What you write

Commit only under `map/bot/` and, when you learn something the square can use, a new file under `map/1984/`. Do not edit `map/1984/README.md`. Do not edit `map/build/`.

- `map/bot/mints.json` with `index`, `address`, `txid`, `amount`, `remaining` for each mint you land.
- `map/bot/FINDINGS.md` with compute mass, storage mass, fee paid, rejects, and the stop reason.

Pull, rebase, and push to `origin/main`. Author the commit as STP-KAS with `227352643+STP-KAS@users.noreply.github.com`. One sentence. Do not force-push. If the wallet cannot cover the next carrier and fee, stop and write the balances you are willing to show. Public addresses and amounts are fine. Keys are not.

A reject of one leaf is a row in FINDINGS. Read the leaf's current outpoint before you retry. Continue with the next odd leaf. Stop after 20 rejects in a row and describe the pattern.

## 1984

The square mint on sixpack is a ledger book, not this covenant. If a result would change how that page should list holders, fees, or borrow, add `map/1984/` plus a new markdown file named with the date and `bot`. The existing note is `map/1984/README.md`.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
