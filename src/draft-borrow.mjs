// The KCC-20 draft box compares the raw signed threshold.
// The reference clamps a negative threshold to zero before that compare.

export function draftBorrowAllows(before, after, threshold) {
  return after - before > threshold;
}

export function referenceBorrowAllows(before, after, threshold) {
  const effective = threshold < 0n ? 0n : threshold;
  return after - before > effective;
}
