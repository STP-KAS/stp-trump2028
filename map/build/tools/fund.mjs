// Picks one mature payer coin and writes it outside the repository.
// Prints the fee and the chosen amount. Does not print the key or the outpoint.
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire("C:/Users/Remco/kaspa-tn10/build-storm2/package.json");
globalThis.WebSocket = require("websocket").w3cwebsocket;
const kaspa = require("C:/Users/Remco/kaspa-tn10/build-storm2/sdk/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js");

const keyPath = process.env.ODD_KEY;
const outPath = process.env.ODD_FUNDING;
const url = process.env.ODD_URL || "ws://127.0.0.1:17310";
const suffix = (process.env.ODD_SUFFIX || "0v0ldx").toLowerCase();
const need = BigInt(process.env.ODD_NEED || String(20n * 100_000_000n));
const skip = new Set((process.env.ODD_SKIP_TX || "").split(",").map((item) => item.trim()).filter(Boolean));
if (!keyPath || !outPath) {
  console.log("FAIL ODD_KEY and ODD_FUNDING");
  process.exit(2);
}
if (outPath.replaceAll("/", "\\").toLowerCase().includes("\\map\\")) {
  console.log("FAIL funding path is inside the map tree");
  process.exit(2);
}

function loadKey() {
  const raw = fs.readFileSync(keyPath, "utf8").trim();
  const hex = raw.split(/\r?\n/).pop().trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error("key file");
  return new kaspa.PrivateKey(hex);
}

const key = loadKey();
const address = key.toKeypair().toAddress("testnet-10").toString();
if (!address.toLowerCase().endsWith(suffix)) {
  console.log("FAIL payer suffix");
  process.exit(2);
}

const rpc = new kaspa.RpcClient({ url, encoding: kaspa.Encoding.Borsh, networkId: "testnet-10" });
await rpc.connect({ timeoutDuration: 8000, blockAsyncConnect: true, strategy: "fallback" });
const si = await rpc.getServerInfo();
if (String(si.networkId) !== "testnet-10" || !si.isSynced || !si.hasUtxoIndex) {
  console.log("FAIL node " + si.networkId + " synced=" + si.isSynced + " utxo=" + si.hasUtxoIndex);
  await rpc.disconnect();
  process.exit(2);
}
const fee = Math.round(Number((await rpc.getFeeEstimate({})).estimate.normalBuckets[0].feerate));
const dag = await rpc.getBlockDagInfo();
const daa = BigInt(dag.virtualDaaScore);
const entries = (await rpc.getUtxosByAddresses({ addresses: [address] })).entries || [];
let best = null;
for (const e of entries) {
  const x = e.entry ? e.entry : e;
  const amount = BigInt(x.amount);
  const txid = String(x.outpoint.transactionId);
  const coinbase = !!x.isCoinbase;
  const score = BigInt(x.blockDaaScore);
  if (skip.has(txid)) continue;
  if (coinbase && daa < score + 100n) continue;
  if (amount < need) continue;
  if (!best || amount < best.amount) {
    const spk = x.scriptPublicKey;
    best = {
      amount,
      txid,
      index: Number(x.outpoint.index),
      coinbase: coinbase ? "1" : "0",
      blockDaa: score.toString(),
      script: typeof spk.script === "string" ? spk.script : String(spk.script),
    };
  }
}
if (!best) {
  console.log(JSON.stringify({ ok: false, fee, suffix, need: need.toString() }));
  await rpc.disconnect();
  process.exit(3);
}
fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
fs.writeFileSync(outPath, [
  "txid=" + best.txid,
  "index=" + best.index,
  "amount=" + best.amount.toString(),
  "coinbase=" + best.coinbase,
  "blockDaa=" + best.blockDaa,
  "script=" + best.script,
  "",
].join("\n"));
console.log(JSON.stringify({
  ok: true,
  fee,
  suffix,
  kas: (best.amount / 100_000_000n).toString(),
  url,
}));
await rpc.disconnect();
