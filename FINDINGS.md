> **Experimental. Not advice.**
>
> A reading of Last Call KCC-20 and the merged reference, checked in this model. Not a patch. Not posted upstream.

# Last Call reading

Pins: kaspanet/kccs `3fbec524` (main, 7 Oct 2026, KCC-20 status Last Call) and argent-lang/kcc20-reference `c8a08711`. Nothing here was posted on kaspanet/kccs or on the reference repository.

## 1. The decrease hole is closed in the text

On `411b41bc` the boxed compare used the raw signed threshold. A balance of 1,000 with a threshold of -1,000 could fall to 1, because `-999 > -1000`. A threshold of -1 allowed a borrow that left the balance unchanged.

Last Call `3fbec524` sets the effective threshold to `max(decoded_threshold, 0)` and requires the increase to exceed that. The same fall to 1 is now a reject. An unchanged balance is a reject. The reference clamp and this text now say the same thing. `npm test` locks both answers: the old box still allows the fall, and Last Call does not.

A negative payload still allows a borrow that increases the amount by one. That matches a threshold of zero. The stored guard bytes stay as they were. The vector `threshold-guard-normalized` rejects a borrow that rewrites a negative guard into a zero guard.

The caller of `mint` can still install that negative payload. The recipient does not sign the mint.

## 2. One extension is still not one covenant

Fungibility in the text is inside one covenant family. The same extension on two launch paths is two covenant ids.

The 7 Oct submit used path `launch::stp-trump2028` and covenant id:

```text
9631239207025d6ec0cfc59095bc345f20a9de63967db2ea0f60af826c0798e8
```

Its signing key was discarded. Remaining allowance 20,144,800 stays on that family. The plan on the front page uses path `launch::stp-trump2028-last-call`. That is a new family even though the name digest is the same. A wallet that keys only on the digest will merge the two. A wallet that keys only on the covenant id will keep them apart.

## 3. The header still writes P2PKHHash and sets no deadline

The Last Call default configuration still names `P2PKHHash(pubkey)` for schemes `0x01` and `0x02`. KCC-2 defines the value as unkeyed `Hash(x)` and does not define that name. This mint uses owner scheme `0x00`, `p2pk-schnorr/v1`, so the owner field is the public key and this name is not on the mint path.

KCC-0 says a Last Call header carries a Last-Call-Deadline. The `3fbec524` header has the status and no deadline. KCC-20 is not Final.

## What is not run

No second program was written for the old box. A P2SH authority index of 255 on a short transaction is not run. A KCC20 input with a negative amount is not run. The 5,000-address mint is not submitted. The 150-caller swarm was not submitted.

Intentions are good; thought process is questionable. STP remains delusional. Si vis pacem, para bellum.
