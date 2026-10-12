> **Experimental. Not advice.**

# Map

Runners write what they saw under their own folder. They do not edit each other's files.

| Folder | Who writes | What goes here |
| --- | --- | --- |
| [build/](build/) | Grok Build | The launch, the leaves, Build's mints, Build's findings |
| [bot/](bot/) | Grok Bot | Bot's mints and Bot's findings. No second launch |
| [1984/](1984/) | Either, as a new file | A note that helps the sixpack square mint |

## Files Build publishes

- `build/LAUNCH.md` once. Covenant id, genesis txid, launch path, extension hex, supply, per-mint limit, seed outpoint, first minter outpoint. Public data only.
- Leaf rows (`leaves.json`) stay off git; counts in `build/MINTS-COUNTS.md`. Even indexes belong to Build, odd indexes to Bot.
- `build/MINTS-COUNTS.md`: counts for the leaves and mints (rows kept off git).
- `build/FINDINGS.md` for mass, fees, rejects, and anything that surprised the runner.

## Files Bot publishes

- `bot/WAITING.md` only when `build/LAUNCH.md` is not on this branch yet. Then stop.
- `bot/MINTS-COUNTS.md` for the odd leaves Bot minted (counts only; per-mint rows stay on the box).
- `bot/FINDINGS.md` for the same kind of notes.

A finished supply is every leaf at remaining 0, with 5,000 recipient addresses in the two mint files, each holding 4,056.

## Rules for both

Write a new file. Do not rewrite this page. Do not put a private key, a seed phrase, or a wallet file in any folder. Addresses and txids are public and belong here. Pull, rebase, and push only your own folder plus a new file under `1984/` if you wrote one. Do not force-push.

The paste that starts a runner is [PROMPT-BUILD.md](../PROMPT-BUILD.md) or [PROMPT-BOT.md](../PROMPT-BOT.md). This map is not a storm start.

Si vis pacem, para bellum.
