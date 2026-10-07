import { pathToFileURL } from "node:url";
import { mintShape, BLOCK_MASS, SOMPI_PER_KAS, COVENANT_PLURALITY } from "./mass.mjs";
import {
  ADDRESS_COUNT,
  MINT_LIMIT,
  SUPPLY,
  TOKEN_NAME,
  EXTENSION,
  addresses,
  genesis,
  mint,
  recipientFor,
  splitToLeaves,
} from "./mint.mjs";

const KAS = SOMPI_PER_KAS;

function shaped(carrier, deposit, caller) {
  return mintShape({
    deposit,
    caller,
    carrier,
    fee: KAS,
    covenantPlurality: COVENANT_PLURALITY,
  });
}

export function shapes() {
  return {
    thin: shaped((2n * KAS) / 10n, KAS, 10n * KAS),
    oneKas: shaped(KAS, KAS, 10n * KAS),
    fat: shaped(100n * KAS, 100n * KAS, 400n * KAS),
    plain: {
      thin: mintShape({ deposit: KAS, caller: 10n * KAS, carrier: (2n * KAS) / 10n, fee: KAS }),
      oneKas: mintShape({ deposit: KAS, caller: 10n * KAS, carrier: KAS, fee: KAS }),
      fat: mintShape({ deposit: 100n * KAS, caller: 400n * KAS, carrier: 100n * KAS, fee: KAS }),
    },
  };
}

function byRatioDesc(left, right) {
  if (left.feeRatio === right.feeRatio) {
    return left.index - right.index;
  }
  return left.feeRatio > right.feeRatio ? -1 : 1;
}

export function pack(txs, grams, blockMass = BLOCK_MASS) {
  const ordered = [...txs].sort(byRatioDesc);
  const blocks = [];
  let current = [];
  let used = 0n;
  for (const tx of ordered) {
    if (current.length > 0 && used + grams > blockMass) {
      blocks.push({ used, txs: current });
      current = [];
      used = 0n;
    }
    if (grams > blockMass) {
      throw new Error("tx heavier than a block");
    }
    current.push(tx);
    used += grams;
  }
  if (current.length > 0) {
    blocks.push({ used, txs: current });
  }
  return {
    grams,
    perBlock: grams === 0n ? 0 : Number(blockMass / grams),
    blocks: blocks.length,
    first: blocks[0] ? blocks[0].txs.length : 0,
    firstNames: blocks[0] ? blocks[0].txs.slice(0, 3).map((tx) => tx.name) : [],
    lastName: blocks.at(-1)?.txs.at(-1)?.name ?? null,
    ordinaryInFirst: blocks[0] ? blocks[0].txs.some((tx) => tx.name === "ordinary") : false,
  };
}

function launch() {
  const root = genesis();
  const tree = splitToLeaves(root);
  const callers = addresses();
  if (tree.minters.length !== callers.length) {
    throw new Error("leaf count");
  }
  const ranked = [...callers].sort(byRatioDesc);
  let issued = 0n;
  const minted = [];
  for (let index = 0; index < tree.minters.length; index += 1) {
    const before = tree.minters[index].remaining;
    const caller = callers[index];
    const next = mint(tree.minters[index], recipientFor(caller.name));
    issued += before - next.remaining;
    minted.push({
      ...caller,
      minter: tree.minters[index].id,
      amount: (before - next.remaining).toString(),
      remaining: next.remaining.toString(),
    });
  }
  const splitTxs = tree.rounds.reduce((sum, round) => sum + round.length, 0);
  return {
    issued,
    splitTxs,
    splitRounds: tree.rounds.length,
    roundSizes: tree.rounds.map((round) => round.length),
    minted,
    ranked: ranked.map((row) => row.name),
  };
}

export function report() {
  const done = launch();
  const body = shapes();
  const callers = addresses();
  const ordinary = { index: -1, name: "ordinary", feeRatio: 4n };
  const contending = [...callers, ordinary];
  const packs = {
    thin: pack(contending, body.thin.grams),
    oneKas: pack(contending, body.oneKas.grams),
    fat: pack(contending, body.fat.grams),
    citedKrc20: pack(contending, 25_000n),
    citedOrdinaryTx: pack(contending, 1_624n),
  };

  const oneUnitTxs = SUPPLY;
  const heavyPerBlock = BLOCK_MASS / 25_000n;
  const secondsAt1 = oneUnitTxs / heavyPerBlock;
  const secondsAt10 = secondsAt1 / 10n;

  return {
    token: TOKEN_NAME,
    extension: EXTENSION,
    supply: SUPPLY.toString(),
    mintLimit: MINT_LIMIT.toString(),
    addresses: ADDRESS_COUNT,
    feeRatioMin: callers[0].feeRatio.toString(),
    feeRatioMax: callers[callers.length - 1].feeRatio.toString(),
    issued: done.issued.toString(),
    splitTxs: done.splitTxs,
    splitRounds: done.splitRounds,
    roundSizes: done.roundSizes,
    highestFirst: done.ranked[0],
    lowestMint: done.ranked[done.ranked.length - 1],
    shapes: {
      thinGrams: body.thin.grams.toString(),
      oneKasGrams: body.oneKas.grams.toString(),
      fatGrams: body.fat.grams.toString(),
    },
    packs,
    serialOneMinterBlocks: ADDRESS_COUNT,
    serialSecondsAt10Bps: ADDRESS_COUNT / 10,
    mintAmountOneCounterfactual: {
      txs: oneUnitTxs.toString(),
      grams: "25000",
      perBlock: heavyPerBlock.toString(),
      secondsAt1Bps: secondsAt1.toString(),
      secondsAt10Bps: secondsAt10.toString(),
      hoursAt1Bps: (Number(secondsAt1) / 3600).toFixed(2),
      hoursAt10Bps: (Number(secondsAt10) / 3600).toFixed(2),
    },
  };
}

function main() {
  console.log(JSON.stringify(report(), (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
