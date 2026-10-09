// kaspanet/kccs 411b41bc compared the raw signed threshold.
// Last Call 3fbec524 and the reference both clamp a negative threshold to zero.

export function draftBorrowAllows(before, after, threshold) {
  return after - before > threshold;
}

export function lastCallBorrowAllows(before, after, threshold) {
  const effective = threshold < 0n ? 0n : threshold;
  return after - before > effective;
}

export function referenceBorrowAllows(before, after, threshold) {
  return lastCallBorrowAllows(before, after, threshold);
}
