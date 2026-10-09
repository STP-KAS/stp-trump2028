> **Experimental. Not advice.**

# Findings

Grok Build launched one KCC-20 Last Call family on the local testnet-10 node and submitted the even half. The node accepted the genesis, all 4,999 splits, all 2,500 even mints, and all 2,500 reclaims of those emptied deposits. Rejects: 0. There was no second genesis.

Odd leaves stay open for Grok Bot. That is why those minters are not at remaining 0. Each odd leaf still has remaining 4,056. The two halves are one covenant. Bot spends its own wallet.

## Acceptance

At 2026-10-09T18:54:29Z the local node still held 8,285 of these transactions in the mempool. The first split was already out of the mempool. The first even mint was still in the mempool. No reclaim payout was in the UTXO set yet. The chain is serial because every split and even mint spends one change output. It was leaving the mempool at about 6 transactions a second, which clears this chain well before the 20:53Z rehearsal send. The ordinary feerate at submit was 100 sompi/gram.

## Mass and fee

The price was storage mass. Version is 1. Sigop count on these inputs is 0. The compute budget is 10 on a plain input, 2 on a split's covenant input, and the mint and reclaim covenant inputs carry the budget the reference signed. Storage mass 80,000 grams is above compute mass and above half the transient mass, so the paid fee is 80,000 × 100 = 8,000,000 sompi on genesis, on every split, and on every mint.

| Kind | Count | Storage | Compute | Transient | Fee each |
| --- | ---: | ---: | ---: | ---: | ---: |
| Genesis | 1 | 80,000 | 2,540 | 1,760 | 0.08 KAS |
| Split | 4,999 | 80,000 | 4,857–4,859 | 10,228–10,236 | 0.08 KAS |
| Mint | 2,500 | 80,000 | 9,117 | 26,068 | 0.08 KAS |
| Reclaim | 2,500 | 0 | 3,653 | 9,172 | 0.02 KAS |

Reclaim storage mass is 0. Half its transient mass is 4,586 grams. The fee fit starts at 20,000 grams, so the reclaim paid 0.02 KAS from the 1 KAS deposit and returned 0.98 KAS to the deposit owner. Fees for the whole Build run are 650.00 KAS.

## Spend cap

Build and Bot each have a mint budget of 1,000,000 tKAS. No mint output in this run sends more than 1,000,000 tKAS to one address. The token carrier is 1 KAS. Recipients were not topped up.

Build's gross debit, before the reclaim payouts come back, is 8,101.00 KAS. The net that stays out of the Build address is 5,651.00 KAS: the 1 KAS seed, 2,500 KAS of odd-leaf deposits, 2,500 KAS of even-leaf carriers, and 650.00 KAS of fees. The even deposits come back minus the reclaim fee. Both numbers are under the cap.

The odd-leaf deposits are owned by the Build address. Bot does not reclaim them. Bot pays the carrier and the fee for each odd mint from the Bot wallet.

## Slow odd sample

Build then minted twelve odd leaves, indexes 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, and 23, one every 3 seconds. The local node accepted all twelve. Those leaf outpoints then left the remaining-4,056 set. The payer was the Build wallet, from a 21 KAS coin, at 100 sompi/gram. Storage mass on this smaller coin was 72,816 to 76,511 grams. Fees were 0.900707 KAS, plus 12 KAS of carriers. That is about 12.90 KAS more, still inside the 1,000,000 tKAS cap. The rows are in `odds.json`. The other odd leaves stay open for Bot.

The builder Bot runs is [tools/README.md](tools/README.md). It builds only odd mints. It does not launch, split, or reclaim.

## Stop

Stop reason: the even half was accepted, the odd half is Bot's, and the spend is inside the 1,000,000 tKAS cap. The run did not hit 20 rejects, and it did not run out of tKAS.

`leaves.json` lists all 5,000 leaves. Even indexes have remaining 0. Odd indexes have remaining 4,056. `depositAddress` is the deposit owner, not the token holder. The token holder of an even leaf is the address in `mints.json`.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
