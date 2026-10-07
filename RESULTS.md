# What was tested

Run on 7 Oct 2026. No transaction was submitted. The reference checkout is commit `8c8dc8ee`. Rust was `rustc 1.97.1`.

## 1. The reference machine

```text
cargo test --locked --all-targets
cargo run --locked --bin kcc20 -- mint
```

`cargo test` passed 54 tests and failed 0. The example target compiled and ran 0 tests of its own. The mint command exited 0.

The example starts with remaining 25 and a per-mint limit of 10. It then mints 10 (15 left), 10 (5 left), and 5 (0 left), and transfers each mint. The ids it prints are virtual-machine ids. The funding output in that example is a synthetic `OP_TRUE` at a demo outpoint.

Tests that bear on the later items, all passed:

- `public_mint_accepts_full_partial_and_maximum_allotments` includes `i64::MAX`.
- `minter_reclaim_requires_exhaustion_and_its_owner` accepts a reclaim at zero by the owner and rejects remaining 1 and the other key.
- `seeder_split_create_borrow_and_reclaim_keep_a_live_seed` is the TokenSeed path below.

## 2. Script public key and plurality

From `fixtures/public-mint/artifact.json` at that commit, the compiled bytecode lengths are:

| Actor | Bytecode bytes |
| --- | ---: |
| PublicMint | 2,019 |
| KCC20 | 4,031 |
| TokenSeed | 1,355 |

Argent builds the output script with `pay_to_script_hash_script`. That script is `OpBlake2b`, `OpData32`, 32 hash bytes, and `OpEqual`: 35 bytes. The bytecode is the redeem script. It is revealed when the output is spent. It is not the script public key stored on the output.

Storage bytes are 63 plus the script length, plus 32 when the output has a covenant id. A 100-byte unit rounds up.

| Output | Bytes | Plurality |
| --- | ---: | ---: |
| Pay-to-script-hash, no covenant id | 98 | 1 |
| Pay-to-script-hash plus covenant id | 130 | 2 |

Plurality is squared in the storage-mass term. The thin mint, with covenant plurality 2 on the minter and the token output, is 232,955 grams. Two fit in a 500,000-gram block. One hundred and fifty of them plus one ordinary transaction take 76 blocks, which is 7.6 seconds at 10 blocks per second.

The same thin shape at plurality 4 is 938,411 grams. That is more than one block. This artifact is plurality 2, so one thin mint still fits.

Compute mass was not measured on a serialized transaction. The redeem script is carried in the signature script at 1 gram per byte, so the 2,019-byte PublicMint script is a few thousand compute grams. The thin storage mass is the larger number.

## 3. A node submission

Not sent.

The reference mint spends a synthetic outpoint. Submitting that transaction would not be a covenant mint the node can accept. gRPC `127.0.0.1:16210` and Borsh `17210` accepted a TCP connection. JSON `18210` did not, so a fee-estimate call there failed. Public mempools were not used.

The accept and reject checks that were actually executed are the virtual-machine ones: a normal mint is accepted, an over-mint is rejected, and a second spend has to use the reduced allowance.

## 4. How the node orders fee ratios

`FeerateTransactionKey` sets `weight = (fee / mass) ^ 3`. The constant `ALPHA` is 3. A draw picks a point in the total weight.

With equal mass, the 150 ratios and one ordinary ratio of 4 give:

| Caller | Ratio | Share of the weight |
| --- | ---: | ---: |
| mint-150 | 3,775 | 2.61% |
| mint-149 | 3,750 | 2.56% |
| mint-001 | 50 | 0.000006% |
| ordinary | 4 | about 3e-9% |

A ratio of 50 weighs 1,953 times a ratio of 4. `mint-150` is only about 1.02 times `mint-149`, so the highest ratio does not always land first. In 4,000 draws from seed 7, the ordinary transaction was first zero times, and `mint-150` was first more often than `mint-001`.

## 5. Integer edges

In this model, checked by `npm test`:

- A mint of `2^63 - 1` against a matching allowance leaves zero.
- One unit above that is rejected.
- A split of 1 from a remaining of 1 is rejected, because half of 1 is 0.
- Borrow scheme `0x80` is rejected. The reference's `0x80` case is a guard byte inside an amount-threshold policy, and that case is accepted by the suite. It is not a scheme id.
- Reclaim by the owner at remaining zero returns the deposit. Reclaim before zero is rejected. Reclaim by another name is rejected.

The reference suite covers the same owner check with real keys, and it accepts the full `i64::MAX` allotment.

## 6. TokenSeed

`seeder_split_create_borrow_and_reclaim_keep_a_live_seed` passed.

A create of amount 1 is rejected. A create of amount 0 is accepted. The seed output is recreated and the new token output holds zero. A later mint comes from `PublicMint`, and a borrowed receive pays that mint into the zero receiver. The seed does not increase supply. A seed reclaim without a surviving seed is rejected.

## 7. The KUSDT lock

Separate program. Script engine:

```text
cargo test --offline --test lock
```

6 passed, 0 failed. The holder redeems the full locked sompi. The fee stays on the other input. A skimmed output, a different recipient, and a different key fail.

Guest tag:

```text
node --test guest/split.test.mjs
```

5 passed, 0 failed. Using the tag as gas is refused, and that refusal does not consume the landing.

## This repo

```text
npm test
```

13 passed, 0 failed. That run checks the supply, the 150 fee ratios, the plurality, the integer edges, and the weight draws above.
