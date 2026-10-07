import assert from "node:assert/strict";
import test from "node:test";
import { storageMass, asCells, BLOCK_MASS, COVENANT_PLURALITY, P2SH_SCRIPT_LEN, plurality, mintShape, relayFee, relayMass, SOMPI_PER_KAS } from "../src/mass.mjs";
import {
  ADDRESS_COUNT,
  EXTENSION,
  I64_MAX,
  MINT_LIMIT,
  SUPPLY,
  TOKEN_NAME,
  addresses,
  fail,
  genesis,
  mint,
  reclaim,
  recipientFor,
  split,
  splitToLeaves,
} from "../src/mint.mjs";
import { pack, report, shapes } from "../src/storm.mjs";
import { firstPickCounts, weight, weightShare } from "../src/sample.mjs";

test("the name commits with unkeyed BLAKE3", async () => {
  const { blake3 } = await import("@noble/hashes/blake3");
  const empty = Buffer.from(blake3(new Uint8Array())).toString("hex");
  assert.equal(empty, "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262");
  assert.equal(TOKEN_NAME, "stp trump2028");
  assert.equal(EXTENSION.length, 64);
  assert.equal(
    EXTENSION,
    "379d7a15ef3efe6104cb58d99e0633c95d54f679914cbbffcba99230dbdb5706",
  );
});

test("supply is 150 mint limits and genesis holds all of it", () => {
  assert.equal(MINT_LIMIT * BigInt(ADDRESS_COUNT), SUPPLY);
  const root = genesis();
  assert.equal(root.remaining, SUPPLY);
  assert.equal(root.mintAmount, MINT_LIMIT);
  assert.equal(root.extension, EXTENSION);
});

test("mint rejects a zero, a limit break, a supply break, a foreign name, and a bad scheme", () => {
  const root = genesis();
  assert.equal(mint(root, recipientFor("mint-001")).remaining, SUPPLY - MINT_LIMIT);
  assert.throws(() => mint(root, recipientFor("mint-001", 0n)), (error) => error.reason === "amount");
  assert.throws(() => mint(root, recipientFor("mint-001", MINT_LIMIT + 1n)), (error) => error.reason === "limit");
  const short = { ...root, remaining: 10n };
  assert.throws(() => mint(short, recipientFor("mint-001", 11n)), (error) => error.reason === "remaining");
  const foreign = { ...recipientFor("mint-001"), extension: "00".repeat(32) };
  assert.throws(() => mint(root, foreign), (error) => error.reason === "extension");
  const scheme = { ...recipientFor("mint-001"), ownerScheme: 0xff };
  assert.throws(() => mint(root, scheme), (error) => error.reason === "owner-scheme");
  const borrow = { ...recipientFor("mint-001"), borrowScheme: 0x80 };
  assert.throws(() => mint(root, borrow), (error) => error.reason === "borrow-scheme");
  const skim = { ...recipientFor("mint-001"), kasOut: root.kas - 1n };
  assert.throws(() => mint(root, skim), (error) => error.reason === "deposit");
});

test("split keeps at most half and conserves the allowance", () => {
  const root = genesis();
  assert.throws(() => split(root, 0n, { id: 1, owner: "x" }), (error) => error.reason === "take");
  assert.throws(() => split(root, SUPPLY / 2n + 1n, { id: 1, owner: "x" }), (error) => error.reason === "half");
  const parts = split(root, SUPPLY / 2n, { id: 1, owner: "x" });
  assert.equal(parts.retained.remaining + parts.added.remaining, SUPPLY);
  assert.equal(parts.retained.owner, "deposit");
  assert.equal(parts.added.owner, "x");
  assert.equal(parts.retained.kas, parts.added.kas);
  assert.equal(parts.retained.mintAmount, MINT_LIMIT);
});

test("the deposit returns only at zero and only to its owner", () => {
  const root = genesis();
  assert.throws(() => reclaim(root, root.owner), (error) => error.reason === "remaining");
  const empty = { ...root, remaining: 0n };
  assert.throws(() => reclaim(empty, "other"), (error) => error.reason === "owner");
  assert.equal(reclaim(empty, root.owner).released, root.kas);
});

test("150 leaves each mint once and the supply is exhausted", () => {
  const tree = splitToLeaves();
  assert.equal(tree.minters.length, ADDRESS_COUNT);
  const splitTxs = tree.rounds.reduce((sum, round) => sum + round.length, 0);
  assert.equal(splitTxs, ADDRESS_COUNT - 1);
  let issued = 0n;
  const callers = addresses();
  const ratios = new Set(callers.map((row) => row.feeRatio.toString()));
  assert.equal(ratios.size, ADDRESS_COUNT);
  assert.equal(callers[0].feeRatio, 50n);
  assert.equal(callers[149].feeRatio, 3775n);
  for (let index = 0; index < tree.minters.length; index += 1) {
    const before = tree.minters[index];
    assert.equal(before.remaining, MINT_LIMIT);
    const after = mint(before, recipientFor(callers[index].name));
    assert.equal(after.remaining, 0n);
    assert.equal(reclaim(after, after.owner).released, after.kas);
    issued += MINT_LIMIT;
  }
  assert.equal(issued, SUPPLY);
});

test("a second mint of the same output sees the reduced allowance", () => {
  const root = genesis();
  const once = mint(root, recipientFor("mint-001", 1n));
  assert.equal(once.remaining, SUPPLY - 1n);
  const twice = mint(once, recipientFor("mint-002", 1n));
  assert.equal(twice.remaining, SUPPLY - 2n);
});

test("storage mass matches the consensus integer formula", () => {
  const relaxed = storageMass(asCells([2n]), asCells([1n, 1n]), 10n);
  assert.equal(relaxed, 15n);
  const arithmetic = storageMass(asCells([10n, 10n, 10n]), asCells([1n, 1n]), 100n);
  assert.equal(arithmetic, 170n);
});

test("a covenant output has plurality 2 and a plurality of 4 does not fit", () => {
  assert.equal(P2SH_SCRIPT_LEN, 35n);
  assert.equal(plurality(P2SH_SCRIPT_LEN, false), 1n);
  assert.equal(COVENANT_PLURALITY, 2n);
  const body = shapes();
  assert.equal(body.thin.grams, 232955n);
  assert.equal(body.oneKas.grams, 73069n);
  assert.equal(body.fat.grams, 653n);
  assert.ok(body.fat.grams * BigInt(ADDRESS_COUNT) < BLOCK_MASS);
  const kas = SOMPI_PER_KAS;
  const tooWide = mintShape({
    deposit: kas,
    caller: 10n * kas,
    carrier: (2n * kas) / 10n,
    fee: kas,
    covenantPlurality: 4n,
  });
  assert.ok(tooWide.grams > BLOCK_MASS);
  assert.equal(100_000_000n / 25_000n, 4000n);
});

test("integer edges match the reference limits", () => {
  const root = genesis();
  const ceiling = { ...root, remaining: I64_MAX, mintAmount: I64_MAX };
  assert.equal(mint(ceiling, recipientFor("mint-001", I64_MAX)).remaining, 0n);
  assert.throws(
    () => mint(ceiling, recipientFor("mint-001", I64_MAX + 1n)),
    (error) => error.reason === "i64",
  );
  const one = { ...root, remaining: 1n };
  assert.throws(() => split(one, 1n, { id: 1, owner: "x" }), (error) => error.reason === "half");
  const scheme = { ...recipientFor("mint-001"), borrowScheme: 0x80 };
  assert.throws(() => mint(root, scheme), (error) => error.reason === "borrow-scheme");
});

test("fee weight is the cube of the ratio, so the top mint is not certain", () => {
  assert.equal(weight(50n) / weight(4n), 1953n);
  const rows = [...addresses(), { index: -1, name: "ordinary", feeRatio: 4n }];
  const shares = weightShare(rows);
  const top = shares.find((row) => row.name === "mint-150");
  const low = shares.find((row) => row.name === "mint-001");
  const ordinary = shares.find((row) => row.name === "ordinary");
  assert.ok(top.share < 0.05);
  assert.ok(low.share > ordinary.share);
  const counts = firstPickCounts(rows, 4000, 7);
  assert.equal(counts.get("ordinary"), 0);
  assert.ok(counts.get("mint-150") > counts.get("mint-001"));
});

test("higher fee ratio is mined first and a full block leaves the ordinary tx waiting", () => {
  const callers = addresses();
  const ordinary = { index: -1, name: "ordinary", feeRatio: 4n };
  const heavy = pack([...callers, ordinary], 25_000n);
  assert.equal(heavy.perBlock, 20);
  assert.equal(heavy.first, 20);
  assert.equal(heavy.firstNames[0], "mint-150");
  assert.equal(heavy.ordinaryInFirst, false);
  assert.equal(heavy.blocks >= 8, true);
  const light = pack([...callers, ordinary], 1_624n);
  assert.equal(light.first, ADDRESS_COUNT + 1);
  assert.equal(light.ordinaryInFirst, true);
});

test("the accepted mint pays half its transient mass", () => {
  assert.equal(SUPPLY - MINT_LIMIT, 20_144_800n);
  assert.equal(relayMass(8_706n, 25_864n), 12_932n);
  assert.equal(relayFee(8_706n, 25_864n, 400n), 5_172_800n);
  assert.equal(relayFee(2_083n, 1_412n, 400n), 833_200n);
  assert.ok(17_520n > relayMass(8_706n, 25_864n));
  assert.ok(relayFee(8_706n, 25_864n, 400n) < 17_520n * 400n);
  const coinbase = 706_277_464n;
  const minter = 176_569_366n;
  const change = 524_535_298n;
  const carrier = 519_362_498n;
  assert.equal(coinbase - minter - change, 5_172_800n);
  assert.equal(minter + change - minter - carrier, 5_172_800n);
});

test("the storm report closes the supply and names the counterfactual", () => {
  const result = report();
  assert.equal(result.token, TOKEN_NAME);
  assert.equal(result.issued, SUPPLY.toString());
  assert.equal(result.addresses, 150);
  assert.equal(result.highestFirst, "mint-150");
  assert.equal(result.lowestMint, "mint-001");
  assert.equal(result.mintAmountOneCounterfactual.hoursAt1Bps, "281.67");
  assert.equal(result.mintAmountOneCounterfactual.hoursAt10Bps, "28.17");
  assert.deepEqual(result.roundSizes, [1, 2, 4, 8, 16, 32, 64, 22]);
  assert.equal(result.shapes.thinGrams, "232955");
  assert.equal(result.shapes.oneKasGrams, "73069");
  assert.equal(result.shapes.fatGrams, "653");
  assert.equal(result.packs.thin.blocks, 76);
  assert.equal(result.packs.oneKas.blocks, 26);
  assert.equal(result.packs.fat.blocks, 1);
  assert.equal(fail("marker").reason, "marker");
});
