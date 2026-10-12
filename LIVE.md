> **Experimental. We are just trying this.**
>
> We test, we write down what we think we saw, and that is the whole product. A number here is not the truth. A chart is not the truth. Any other sentence that sounds sure of itself is not the truth either. Do not count any of it as a claim.

# One local testnet mint

On 7 Oct 2026 a local testnet-10 node accepted one `PublicMint` genesis and one mint of `stp trump2028`. The node called itself rusty-kaspa 2.1.0, synced, with the UTXO index on. The submit used the local Borsh port `17210`. No public mempool was used. One hundred and fifty callers were not submitted.

This page is the 7 Oct 2026 submit. It used path `launch::stp-trump2028`, a per-mint limit of 135,200, and the reference at `8c8dc8ee`. The signing key was discarded. The allowance left on that minter stays where it is. The current plan is a new launch path and is on the front page. KCC-20 has since moved to Last Call at kaspanet/kccs `3fbec524`. This submit is not that launch, and it is not a mainnet token.

## Funding

The local faucet answered HTTP 429 and sent nothing. No existing wallet was spent. The same local node returned one block template. One block was found and the node accepted that block. Its coinbase output paid a new testnet address and was left until mature.

```text
coinbase `[id removed]`
index 1
amount 706277464
address `[address removed]`
```

That is 7.06277464 tKAS. The signing key for this address was discarded after the submit. This page cannot move the outputs.

## What was built

Version 1. Path `launch::stp-trump2028`. Name `stp trump2028`. Extension, unkeyed BLAKE3 of that name:

```text
`[id removed]`
```

Allowance 20,280,000. Per-mint limit 135,200. The mint took one lot of 135,200. Remaining allowance on the new minter is 20,144,800. The other 149 lots were not built for the node.

The fee target was 400 sompi per gram. The builder raised the fee until every transaction covered `max(compute, ceil(transient / 2)) * 400`. It stopped at 5,172,800 sompi. Storage mass is committed and checked. It is not the relay mass. Before this submit, the same local node estimated priority near 2,708 sompi per gram, a normal band near 321 and 141, and a low estimate near 115.

| Transaction | Storage | Compute | Transient | Normalized transient | Fee sompi | Signature bytes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Genesis | 23,144 | 2,083 | 1,412 | 706 | 5,172,800 | 66 |
| Mint | 17,520 | 8,706 | 25,864 | 12,932 | 5,172,800 | 6,024 and 66 |
| Conflict | 17,520 | 8,703 | 25,852 | 12,926 | 5,172,800 | 6,021 and 66 |

The mint's normalized transient is 12,932. Times 400 is 5,172,800, so the mint sets the fee. The genesis would have fit at 833,200 sompi. Its need is `max(2,083, 706) * 400`.

Compute budgets committed on the inputs were 10 for genesis, and 5 then 10 for the mint. The 5 sits on the covenant input. The 10 sits on the ordinary input. The transaction id was calculated again after the budget and the storage mass were set. It did not change. The node accepted that storage mass.

Genesis spends the coinbase. It creates a minter output of 176,569,366 sompi and a plain change output of 524,535,298 sompi. The mint spends both. It recreates the minter at the same 176,569,366 sompi and puts 519,362,498 sompi on the token output. There is no third output. The conflict was the same shape with a mint amount of 1.

The token output is about 5.19 tKAS, not the thin 0.2 KAS row in the model. That is why storage mass is 17,520 rather than 232,955. The heavy part of this mint is transient mass from the redeem script.

## What the node did

Genesis and the mint were accepted into the mempool. The conflict was rejected and was not retried:

```text
Rejected transaction `[id removed]`: output (`[id removed]`, 0) already spent by transaction `[id removed]` in the mempool
```

A later read found both accepted transactions in blocks. Times are the block header timestamps, UTC.

```text
genesis `[id removed]`
included `[id removed]`
included-daa 590545172
included-time 2026-10-07T15:36:25.967Z
included-chain yes
included-txs 213
accepted-by `[id removed]`
accepted-daa 590545175
accepted-time 2026-10-07T15:36:26.125Z

mint `[id removed]`
included `[id removed]`
included-daa 590545176
included-time 2026-10-07T15:36:26.323Z
included-chain no
included-txs 827
accepted-by `[id removed]`
accepted-daa 590545177
accepted-time 2026-10-07T15:36:26.500Z
```

The virtual chain read started at the selected parent of the genesis block. It listed both ids under those accepting chain blocks and removed no blocks. At that read the virtual DAA score was 590,546,897. The mempool no longer had either transaction. The conflict id was not in the mempool and not in that accepted set.

The mint block carried 827 transactions. This submit added one of them.

## Read back

A later read of the same local node, still rusty-kaspa 2.1.0 and still synced, found the same blocks. Virtual DAA score 590,565,584. Mempool size 3. The distance from the mint's accepting block is 20,407 DAA scores.

```text
genesis-included chain yes daa 590545172 txs 213 carries the genesis id
genesis-accepted chain yes daa 590545175
mint-included chain no daa 590545176 txs 827 carries the mint id
mint-accepted chain yes daa 590545177
```

The mint transaction, as stored in its block, is version 1. Payload length 0. Storage mass 17,520. The node's own compute mass for it is 8,706. Input 0 spends genesis output 0, compute budget 5, sigop count 0, signature script 6,024 bytes. Input 1 spends genesis output 1, compute budget 10, sigop count 0, signature script 66 bytes.

That 6,024-byte script contains the extension commitment. Further along, the byte `0x08` precedes the little-endian supply 20,280,000, and another `0x08` precedes the little-endian lot 135,200. The name and the path are not in the script. The new remaining 20,144,800 is not a second integer in the witness.

Both mint outputs are script-hash outputs and carry the same covenant id, bound to authorizing input 0. Genesis output 0 carries that same id. Genesis output 1 has no covenant. The id is:

```text
`[id removed]`
```

The script-hash addresses on the mint are:

```text
minter `[address removed]`
token `[address removed]`
```

The RPC script-public-key field on each of those outputs is 37 bytes. The pay-to-script-hash template in the model is 35 bytes. The node labels the type ScriptHash.

Si vis pacem, para bellum.
