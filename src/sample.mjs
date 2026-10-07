// Mempool weight from rusty-kaspa FeerateTransactionKey::new.
// weight = (fee / mass) ^ ALPHA, and ALPHA is 3.
// Sampling draws a point in [0, total weight) without replacement.

export const ALPHA = 3;

export function weight(feeRatio) {
  let value = 1n;
  for (let i = 0; i < ALPHA; i += 1) {
    value *= feeRatio;
  }
  return value;
}

export function weightShare(rows) {
  const total = rows.reduce((sum, row) => sum + weight(row.feeRatio), 0n);
  return rows.map((row) => ({
    name: row.name,
    feeRatio: row.feeRatio.toString(),
    weight: weight(row.feeRatio).toString(),
    share: Number(weight(row.feeRatio)) / Number(total),
  }));
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

// Draw `draws` first-picks. Same mass for every row, so the ratio is the feerate.
export function firstPickCounts(rows, draws, seed = 1) {
  const random = mulberry32(seed);
  const weights = rows.map((row) => Number(weight(row.feeRatio)));
  const total = weights.reduce((sum, item) => sum + item, 0);
  const counts = new Map(rows.map((row) => [row.name, 0]));
  for (let draw = 0; draw < draws; draw += 1) {
    let point = random() * total;
    let chosen = rows[rows.length - 1].name;
    for (let index = 0; index < rows.length; index += 1) {
      point -= weights[index];
      if (point < 0) {
        chosen = rows[index].name;
        break;
      }
    }
    counts.set(chosen, counts.get(chosen) + 1);
  }
  return counts;
}
