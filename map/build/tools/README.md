> **Experimental. Not advice.**

# Odd mint tool

Builds and submits odd-index mints for the family already launched in `map/build/LAUNCH.md`. It does not build a genesis, a split, or a reclaim.

Covenant `89997c2e03251a4abd22263bf2ac3a11394c9729a32a8520789c60ce2d6f9d67`. Path `launch::stp-trump2028-last-call`. Each open odd leaf mints 4,056 to a new local key. Owner scheme `0x00`. Borrow scheme `0x00`. Borrow guard is 32 zero bytes. The payer pays the 1 KAS carrier and the fee. The deposit owner stays the address already written on the leaf.

The code you compile is argent-lang/kcc20-reference commit `c8a087117735a1f87c5c6d115fcddeaf2562c784`, app `KCC20PublicMint`. Do not push that checkout.

## Compile

```powershell
git clone https://github.com/argent-lang/kcc20-reference
Set-Location kcc20-reference
git checkout c8a087117735a1f87c5c6d115fcddeaf2562c784
Copy-Item $repo\map\build\tools\odds.rs src\bin\kcc20\odds.rs
```

Add these two lines to the `[dependencies]` of that checkout's `Cargo.toml`:

```toml
kaspa-addresses = { git = "https://github.com/kaspanet/rusty-kaspa", rev = "a41a333b08848f41bf737b72592e463a6011b8ac" }
borsh = "1.8.1"
```

In `src/bin/kcc20/main.rs` add `mod odds;` next to the other modules, add `odds` to the usage string, and add this match arm before the catch-all:

```rust
Some("odds") => return odds::run(&artifact),
```

```powershell
cargo build --release --bin kcc20
```

## Pay and build

The payer key file holds one 64-character hex secret. Keep it outside this repository. Grok Bot uses the wallet ending `0v0ldx`. The budget is 1,000,000 tKAS. No output sends more than 1,000,000 tKAS to one address.

`ODD_URL` is the testnet-10 Borsh socket. Keel on this desk is `ws://127.0.0.1:17310`. Pass another wRPC URL when the leaf and the payer coin are on that node instead. From the bot box, use the keel tunnel this runner already has. Do not point that box at `127.0.0.1:17210`.

```powershell
$env:ODD_KEY = "C:\secrets\bot.key"
$env:ODD_FUNDING = "C:\secrets\odd-funding.txt"
$env:ODD_URL = "ws://127.0.0.1:17310"
$env:ODD_SUFFIX = "0v0ldx"
$env:ODD_NEED = "2000000000"
node map\build\tools\fund.mjs

$env:ODD_OUT = "C:\secrets\odd-out"
$env:ODD_KEYS = "C:\secrets\odd-recipients.secret"
$env:ODD_LEAVES = "map\build\leaves.json"
$env:ODD_DEPOSIT_ADDRESS = "kaspatest:qp4jge54eztxewf8r53rtjdvxakmatsu6tjd0nn9sjhgvzxknsfvjvmwurqhd"
$env:ODD_FEE_RATE = "100"
$env:ODD_LIMIT = "12"
.\target\release\kcc20.exe odds
```

`fund.mjs` prints `{ ok, fee, suffix, kas, url }`. Put that `fee` into `ODD_FEE_RATE`. A fat change coin priced the even mints at storage mass 80,000 and 0.08 KAS when the feerate was 100. A smaller coin prices a different storage mass. The builder pays `max(storage, compute, ceil(transient/2))` times the feerate. Leave `ODD_LIMIT` unset to build every open odd leaf.

## Submit

One signed transaction per line is `txs.jsonl`. Submit is slow by default, 3 seconds between transactions.

```powershell
$env:ODD_URL = "ws://127.0.0.1:17310"
$env:ODD_SLOW_MS = "3000"
node map\build\tools\submit.mjs C:\secrets\odd-out\txs.jsonl C:\secrets\odd-out\landed.jsonl
```

Public mint rows are `mints.json` in the output directory. Copy those rows into `map/bot/mints.json`. Do not copy `ODD_KEYS`, the key file, or the funding file.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
