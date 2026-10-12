> **Experimental. Not advice.**
>
> Chosen for this lab. Not a market. Not a dollar.

# Tokenomics

The supply stays 20,280,000. That is 2,028 × 10,000. Five thousand addresses divide it evenly: 20,280,000 / 5,000 = 4,056. Each address mints once, at the limit, and the allowance is finished.

| Field | Value |
| --- | --- |
| Name | `stp trump2028` |
| Extension | unkeyed BLAKE3 of that UTF-8 name |
| Extension hex | `379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706` |
| Launch path | `launch::stp-trump2028-last-call` |
| Supply | 20,280,000 base units |
| Premine | 0 |
| Holders | 5,000 fresh random keys |
| Per-mint limit | 4,056 |
| Mints | 5,000, one full limit each |
| Splits | 4,999, in 13 rounds: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 904 |
| Decimals | none in the covenant |
| Ticker | none in the covenant |
| Owner scheme | `0x00` p2pk-schnorr/v1, the recipient public key |
| Borrow scheme | `0x00` disabled |
| Borrow guard | 32 zero bytes |
| Minter deposit | 1 KAS, returned by `reclaim` when that minter's remaining is 0 |
| Token carrier | 1 KAS on the new token output |
| Genesis group | one `PublicMint` and one `TokenSeed`, same extension, no token balances |
| KCC-20 pin | kaspanet/kccs `3fbec524`, status Last Call |
| Reference pin | argent-lang/kcc20-reference `c8a08711` |

The deposit owner signs only the reclaim. A mint and a split do not need that signature. The caller pays the fee, the child deposit, and the token carrier.

Borrow stays off so a stranger cannot move the token outpoint. A later transfer can turn borrowing on. This mint does not.

The 1 KAS carrier is the live shape. In the packing model it weighs 73,069 grams, six transactions to a 500,000-gram block, 834 blocks for the 5,000 mints plus one ordinary transaction. At 10 blocks per second that is about 83 seconds of full blocks. The thin 0.2 KAS shape weighs 232,955 grams and takes 2,501 blocks. That shape is the congestion reading. It is not the shape to submit.

A limit of 1 on the same supply is still the long counterfactual: about 281.67 hours of full blocks at 1 block per second, or 28.17 hours at 10, at the cited 25,000 grams. This token sits at the short end of that range on purpose.

The earlier family is a different token. Path `launch::stp-trump2028`, covenant id `9631239207025d6ec0cfc59095bc345f20a9de63967db2ea0f60af826c0798e8`, limit 135,200, one accepted mint, key discarded. Leave it.

Si vis pacem, para bellum.
