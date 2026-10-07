import { commitment } from "./commitment.mjs";

export const TOKEN_NAME = "stp trump2028";
export const SUPPLY = 20_280_000n;
export const MINT_LIMIT = 135_200n;
export const ADDRESS_COUNT = 150;
export const I64_MAX = 9223372036854775807n;
export const EXTENSION = commitment(TOKEN_NAME);

const OWNER_SCHEMES = new Set([0x00, 0x01, 0x02, 0x03, 0x04]);
const BORROW_SCHEMES = new Set([0x00, 0x01, 0x02, 0x03]);

export function fail(reason) {
  const error = new Error(reason);
  error.reason = reason;
  return error;
}

export function genesis() {
  return {
    id: 0,
    remaining: SUPPLY,
    mintAmount: MINT_LIMIT,
    owner: "deposit",
    extension: EXTENSION,
    kas: 100_000_000n,
  };
}

function fitsI64(value) {
  return value >= 0n && value <= I64_MAX;
}

function checkRecipient(minter, recipient) {
  if (!fitsI64(recipient.amount) || !fitsI64(minter.remaining) || !fitsI64(minter.mintAmount)) {
    throw fail("i64");
  }
  if (recipient.amount <= 0n) {
    throw fail("amount");
  }
  if (recipient.amount > minter.mintAmount) {
    throw fail("limit");
  }
  if (recipient.amount > minter.remaining) {
    throw fail("remaining");
  }
  if (recipient.extension !== minter.extension) {
    throw fail("extension");
  }
  if (!OWNER_SCHEMES.has(recipient.ownerScheme)) {
    throw fail("owner-scheme");
  }
  if (!BORROW_SCHEMES.has(recipient.borrowScheme)) {
    throw fail("borrow-scheme");
  }
  if (recipient.kasOut !== minter.kas) {
    throw fail("deposit");
  }
}

// PublicMint.mint from the reference: caller picks the recipient.
// The deposit owner does not sign. The allowance falls by the minted amount.
export function mint(minter, recipient) {
  checkRecipient(minter, recipient);
  return {
    ...minter,
    remaining: minter.remaining - recipient.amount,
  };
}

// PublicMint.split: take is at most half, integer division, and at least 1.
export function split(minter, take, child) {
  if (!fitsI64(take) || !fitsI64(minter.remaining)) {
    throw fail("i64");
  }
  if (take <= 0n) {
    throw fail("take");
  }
  if (take > minter.remaining / 2n) {
    throw fail("half");
  }
  return {
    retained: { ...minter, remaining: minter.remaining - take },
    added: {
      ...minter,
      id: child.id,
      remaining: take,
      owner: child.owner,
    },
  };
}

export function reclaim(minter, signer) {
  if (minter.remaining !== 0n) {
    throw fail("remaining");
  }
  if (signer !== minter.owner) {
    throw fail("owner");
  }
  return { released: minter.kas };
}

export function recipientFor(owner, amount = MINT_LIMIT) {
  return {
    amount,
    owner,
    ownerScheme: 0x00,
    borrowScheme: 0x00,
    extension: EXTENSION,
    kasOut: 100_000_000n,
  };
}

// Split until every minter holds exactly one mint limit.
// Each round spends distinct minters, so those splits do not conflict.
export function splitToLeaves(root = genesis()) {
  let nextId = 1;
  let minters = [root];
  const rounds = [];
  while (minters.some((item) => item.remaining > item.mintAmount)) {
    const round = [];
    const produced = [];
    for (const item of minters) {
      if (item.remaining === item.mintAmount) {
        produced.push(item);
        continue;
      }
      if (item.remaining % item.mintAmount !== 0n) {
        throw fail("align");
      }
      const take = (item.remaining / item.mintAmount / 2n) * item.mintAmount;
      if (take <= 0n) {
        throw fail("stuck");
      }
      const child = { id: nextId, owner: `split-${nextId}` };
      nextId += 1;
      const parts = split(item, take, child);
      round.push({
        parent: item.id,
        child: parts.added.id,
        take,
      });
      produced.push(parts.retained, parts.added);
    }
    rounds.push(round);
    minters = produced;
  }
  return { minters, rounds };
}

export function feeRatio(index) {
  if (index < 0 || index >= ADDRESS_COUNT) {
    throw fail("index");
  }
  return 50n + BigInt(index) * 25n;
}

export function addresses() {
  const rows = [];
  for (let index = 0; index < ADDRESS_COUNT; index += 1) {
    const ratio = feeRatio(index);
    rows.push({
      index,
      name: `mint-${String(index + 1).padStart(3, "0")}`,
      feeRatio: ratio,
    });
  }
  return rows;
}
