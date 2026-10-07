> **Experimental. We are just trying this.**
>
> Good intentions, shaky hands. STP does not know what he is doing. We test, we write down what we think we saw, and that is the whole product. A number here is not the truth. A chart is not the truth. Any other sentence that sounds sure of itself is not the truth either. Do not count any of it as a claim.

# Swarm mint

The reference machine minted `stp trump2028`. One hundred and fifty callers. Limited supply. The run stayed on this machine.

This is not a Kaspa transaction. The ids below are virtual-machine ids. Nothing in this run was submitted to a node. The separate network mint is [LIVE.md](LIVE.md).

## Command

The source is [runner/swarm.rs](runner/swarm.rs). It was compiled inside the argent-lang/kcc20-reference checkout at `8c8dc8ee`, as the `swarm` command of the `kcc20` bin. Rust was `rustc 1.97.1`.

```text
cargo run --locked --bin kcc20 -- swarm
```

Exit code 0. Wall clock on the mint loop was 302 ms. The whole run, including 149 splits, was 614 ms.

## What the engine did

Genesis creates one `PublicMint` and one `TokenSeed` under `launch::stp-trump2028`. They share a covenant id. The allowance is 20,280,000. The per-mint limit is 135,200. The extension is unkeyed BLAKE3 of `stp trump2028`:

```text
379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706
```

The split tree is the same eight rounds as the model: 1, 2, 4, 8, 16, 32, 64, 22. That is 149 splits and 150 minters. Each minter holds one mint limit.

The 150 mints then run from the last caller back to the first. None of those mints spends a minter output created by another mint. The engine accepted all 150. Issued supply is 20,280,000. The 150 ids are distinct.

Two extra mints were built against the first minter, before that batch, for two different callers. Both were accepted. They spend the same outpoint. A block can take one of them.

One more mint was built on an output whose allowance was already zero. The engine rejected it.

## Log

```text
launch 31460ae67ad59761445d936641239d9f88a54f8573b5e07beadd68320f102f47
covenant e7f122683c1f791c87fc90e98915a45e52e0ac6768d4b9fb74c69777349fc581
round 1 splits 1 minters 2
round 2 splits 2 minters 4
round 3 splits 4 minters 8
round 4 splits 8 minters 16
round 5 splits 16 minters 32
round 6 splits 32 minters 64
round 7 splits 64 minters 128
round 8 splits 22 minters 150
swarm name=stp-trump2028 extension=379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706 callers=150 issued=20280000 split_txs=149 rounds=[1, 2, 4, 8, 16, 32, 64, 22] mint_ok=150 same_outpoint_pair=2 over_mint=rejected mint_ms=302 total_ms=614
first_in_reverse ba1a6429491e2ac157bd4990ef4b9817896120b913706740eeba78a431321bd4
last_in_reverse 6dba62118f2b194504f89324636db68bb016a03030a976918f6a024799fd14ff
```

`first_in_reverse` is the mint of caller 150. `last_in_reverse` is the mint of caller 1. The funding inputs are synthetic `OP_TRUE` outputs. The caller keys are demo keys derived in the runner. They are not wallets.

## Same time

The script engine runs one transaction, then the next. These 150 do not need that order. Reversing the caller order still produced 150 accepts. That is the condition for them to sit together in a mempool.

They still do not all fit in one block. At the measured thin covenant mass of 232,955 grams, a 500,000-gram block holds 2. The 150 would take 75 blocks of mints, 7.5 seconds at 10 blocks per second, before counting the 149 splits.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
