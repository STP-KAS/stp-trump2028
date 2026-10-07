> **Experimental. Not advice.**
>
> A reading of the Draft and the reference, checked on this machine. Not a patch. Not posted upstream.

# Two holes

## 1. A negative borrow threshold can reduce a balance

The Draft says two things that do not fit together.

In kaspanet/kccs `411b41bc`, `kcc-0020.md` says the first eight bytes of an `amount-threshold/v1` guard are a non-negative KCC-1 `int`. The boxed rule then does this:

```text
amount_difference = next_states[0].amount - leader_state.amount
require(amount_difference > amount_threshold)
```

The prose under that box says every borrowed receive must increase the token amount.

Take a balance of 1,000 and a threshold of -1,000. The next amount 1 gives a difference of -999. `-999 > -1000` is true, so the boxed rule allows the balance to fall to 1. A threshold of -1 allows a borrow that leaves the balance unchanged. Neither is an increase.

The reference does not follow that box. In `contracts/kcc20.ag` a negative threshold is replaced with 0 before the compare, and the borrow then requires a positive increase. `threshold_borrow_clamps_nonpositive_thresholds_to_zero` passed on this machine. The same run accepted `public_mint_accepts_caller_selected_guard`: a mint may install the KCC-1 encoding of -1, which is byte `0x01` followed by six zero bytes and a final `0x80`. The caller of `mint` chooses that guard. The recipient does not sign.

So a program that codes the box, and not the clamp, lets the minter hand someone a token and later pull the balance down. The reference on this machine does not. `npm test` locks the two answers. Script addition on this node uses checked addition and rejects a sum outside the i64 range, so this is not an overflow wrap.

## 2. One extension is not one covenant

The Draft limits fungibility to one covenant family. The same extension in two families is not defined as one token.

A VM launch of `PublicMint` with extension `11` repeated 32 times, path `launch::one`, and a second launch with the same extension and path `launch::two`, produced two covenant ids. The test `same_extension_under_two_launch_paths_is_two_covenant_ids` passed. The name `stp trump2028` is not in the accepted mint script. The script carries the digest. A wallet that keys only on that digest will merge two families. A wallet that keys only on the covenant id will split one name.

The live mint's covenant id remains:

```text
9631239207025d6ec0cfc59095bc345f20a9de63967db2ea0f60af826c0798e8
```

## What these are not

No second transaction was sent. The 150-caller swarm was not sent. Nothing was posted on kaspanet/kccs or on the reference pull.

The next hard checks are a second program that implements the boxed rule and fails the reference's negative-guard cases, a P2SH authority index of 255 on a short transaction, and a KCC20 input whose amount is negative. Those three are not run yet.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
