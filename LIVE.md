> **Experimental. We are just trying this.**
>
> Good intentions, shaky hands. STP does not know what he is doing. We test, we write down what we think we saw, and that is the whole product. A number here is not the truth. A chart is not the truth. Any other sentence that sounds sure of itself is not the truth either. Do not count any of it as a claim.

# One local testnet mint

On 7 Oct 2026 a local testnet-10 node accepted one `PublicMint` genesis and one mint of `stp trump2028`. The node called itself rusty-kaspa 2.1.0, synced, with the UTXO index on. The submit used the local Borsh port `17210`. No public mempool was used. One hundred and fifty callers were not submitted.

KCC-20 is still Draft. The mint app is the open reference at `8c8dc8ee`, not the reference master branch, and not a chapter of the Draft. This is not a mainnet token.

## Funding

The local faucet answered HTTP 429 and sent nothing. No existing wallet was spent. The same local node returned one block template. One block was found and the node accepted that block. Its coinbase output paid a new testnet address and was left until mature.

```text
coinbase bab89fcacc78d64d18f1903fad17d7ca7fed2f29676c32d2803f7077463dbe11
index 1
amount 706277464
address kaspatest:qp7x6aaf0ph8cjx9jaq5k27llapww797j0lzn3u3e2kqqepl4nw45jye4ad3t
```

That is 7.06277464 tKAS. The signing key for this address was discarded after the submit. This page cannot move the outputs.

## What was built

Version 1. Path `launch::stp-trump2028`. Name `stp trump2028`. Extension, unkeyed BLAKE3 of that name:

```text
379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706
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
Rejected transaction f6979e31e11895d164750513484eabde3a9b4da7009e2d9d64c1d59a2332b5aa: output (44d89244a096961278c5569aff71ab2e94ec272d857b440434b8446ec5812056, 0) already spent by transaction 1fd8391dacb6757f4df5f5a59ce60788c39d423f6613ae4a2f51602471e63ecc in the mempool
```

A later read found both accepted transactions in blocks. Times are the block header timestamps, UTC.

```text
genesis 44d89244a096961278c5569aff71ab2e94ec272d857b440434b8446ec5812056
included 9ab38a7e011f58b30620b9087519d9ad1a427766cb58608fd46e680675984472
included-daa 590545172
included-time 2026-10-07T15:36:25.967Z
included-chain yes
included-txs 213
accepted-by dac4e684b1a35ab20960e07e06ed8d83b3a1e02ef23232eeedc2a43dbbf5ea8c
accepted-daa 590545175
accepted-time 2026-10-07T15:36:26.125Z

mint 1fd8391dacb6757f4df5f5a59ce60788c39d423f6613ae4a2f51602471e63ecc
included 883e9b5ba0e55007fed75198e8c834807cdd20313ac4671c3194a7c914723a3b
included-daa 590545176
included-time 2026-10-07T15:36:26.323Z
included-chain no
included-txs 827
accepted-by 1bb014758974b82fe7fb0bb97f117e8f52580d16e12d481c1482e267dcc521bd
accepted-daa 590545177
accepted-time 2026-10-07T15:36:26.500Z
```

The virtual chain read started at the selected parent of the genesis block. It listed both ids under those accepting chain blocks and removed no blocks. At that read the virtual DAA score was 590,546,897. The mempool no longer had either transaction. The conflict id was not in the mempool and not in that accepted set.

The mint block carried 827 transactions. This submit added one of them.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
