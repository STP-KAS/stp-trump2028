// Storage mass from rusty-kaspa consensus::mass::calc_storage_mass.
// C is SOMPI_PER_KASPA * 10_000. Plurality defaults to 1.
// Overall mass charged by the node is max(compute mass, storage mass).
// This file computes storage mass only.

export const STORAGE_C = 1_000_000_000_000n;
export const BLOCK_MASS = 500_000n;
export const SOMPI_PER_KAS = 100_000_000n;

// rusty-kaspa pay_to_script_hash: OpBlake2b, OpData32, 32 hash bytes, OpEqual.
export const P2SH_SCRIPT_LEN = 35n;
export const UTXO_CONST_BYTES = 63n;
export const COVENANT_ID_BYTES = 32n;
export const UTXO_UNIT = 100n;

export function plurality(scriptLen, hasCovenantId) {
  const extra = hasCovenantId ? COVENANT_ID_BYTES : 0n;
  const bytes = UTXO_CONST_BYTES + scriptLen + extra;
  return (bytes + UTXO_UNIT - 1n) / UTXO_UNIT;
}

// A covenant actor output is a P2SH script plus a covenant id.
export const COVENANT_PLURALITY = plurality(P2SH_SCRIPT_LEN, true);

function cell(amount, plurality = 1n) {
  if (amount <= 0n) {
    throw new Error("amount");
  }
  if (plurality <= 0n) {
    throw new Error("plurality");
  }
  return { amount, plurality };
}

export function asCells(values, plurality = 1n) {
  return values.map((amount) => cell(amount, plurality));
}

export function storageMass(inputs, outputs, storm = STORAGE_C) {
  if (inputs.length === 0) {
    throw new Error("inputs");
  }
  let outsPlurality = 0n;
  let harmonicOuts = 0n;
  for (const output of outputs) {
    outsPlurality += output.plurality;
    harmonicOuts += (storm * output.plurality * output.plurality) / output.amount;
  }

  let insPlurality = 0n;
  for (const input of inputs) {
    insPlurality += input.plurality;
  }

  const relaxed =
    outsPlurality === 1n ||
    (inputs.length <= 2 &&
      (insPlurality === 1n || (outsPlurality === 2n && insPlurality === 2n)));

  if (relaxed) {
    let harmonicIns = 0n;
    for (const input of inputs) {
      harmonicIns += (storm * input.plurality * input.plurality) / input.amount;
    }
    return harmonicOuts > harmonicIns ? harmonicOuts - harmonicIns : 0n;
  }

  let sumIns = 0n;
  for (const input of inputs) {
    sumIns += input.amount;
  }
  let mean = sumIns / insPlurality;
  if (mean < 1n) {
    mean = 1n;
  }
  const arithmeticIns = insPlurality * (storm / mean);
  return harmonicOuts > arithmeticIns ? harmonicOuts - arithmeticIns : 0n;
}

// A public-mint transaction keeps the minter deposit and adds a token carrier.
// The fee is input sompi minus output sompi. It is not taken from the deposit.
export function mintShape({ deposit, caller, carrier, fee, covenantPlurality = 1n }) {
  const change = caller - carrier - fee;
  if (change <= 0n) {
    throw new Error("change");
  }
  const inputs = [
    cell(deposit, covenantPlurality),
    cell(caller, 1n),
  ];
  const outputs = [
    cell(deposit, covenantPlurality),
    cell(carrier, covenantPlurality),
    cell(change, 1n),
  ];
  return {
    inputs,
    outputs,
    fee,
    grams: storageMass(inputs, outputs),
    change,
  };
}
