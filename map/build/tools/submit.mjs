// Submits odd-mint jsonl. Default socket is keel. Pass ODD_URL to use another testnet-10 wRPC.
// This file is not measure.mjs and it does not use --mode send.
import { createRequire } from "node:module";
import fs from "node:fs";
import readline from "node:readline";

const require = createRequire("C:/Users/Remco/kaspa-tn10/build-storm2/package.json");
globalThis.WebSocket = require("websocket").w3cwebsocket;
const kaspa = require("C:/Users/Remco/kaspa-tn10/build-storm2/sdk/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js");

const url = process.env.ODD_URL || "ws://127.0.0.1:17310";
const slow = Number(process.env.ODD_SLOW_MS || "3000");
const jsonl = process.argv[2];
const logPath = process.argv[3];
if (!jsonl || !logPath) {
  console.log("FAIL missing jsonl or log path");
  process.exit(2);
}

class Reader {
  constructor(b) { this.b = b; this.pos = 0; }
  u8() { return this.b[this.pos++]; }
  u16() { const v = this.b[this.pos] | (this.b[this.pos + 1] << 8); this.pos += 2; return v; }
  u32() {
    const v = (this.b[this.pos] | (this.b[this.pos + 1] << 8) | (this.b[this.pos + 2] << 16) | (this.b[this.pos + 3] << 24)) >>> 0;
    this.pos += 4;
    return v;
  }
  u64() { return BigInt(this.u32()) + 0x1_0000_0000n * BigInt(this.u32()); }
  bytes(n) { const v = this.b.subarray(this.pos, this.pos + n); this.pos += n; return v; }
  vec() { return this.bytes(this.u32()); }
}
function hex(b) { return Buffer.from(b).toString("hex"); }
function txFromBorsh(hexStr) {
  const bytes = Buffer.from(hexStr, "hex");
  const r = new Reader(bytes);
  const version = r.u16();
  const inputs = Array.from({ length: r.u32() }, () => {
    const transactionId = hex(r.bytes(32));
    const index = r.u32();
    const signatureScript = hex(r.vec());
    const sequence = r.u64();
    const input = { previousOutpoint: { transactionId, index }, signatureScript, sequence, sigOpCount: 0 };
    if (r.u8() === 0) input.sigOpCount = r.u8();
    else input.computeBudget = r.u16();
    return input;
  });
  const outputs = Array.from({ length: r.u32() }, () => {
    const value = r.u64();
    const scriptPublicKey = { version: r.u16(), script: hex(r.vec()) };
    let covenant = null;
    if (r.u8() === 1) covenant = { authorizingInput: r.u16(), covenantId: hex(r.bytes(32)) };
    return { value, scriptPublicKey, covenant };
  });
  const obj = {
    version, inputs, outputs, lockTime: r.u64(), subnetworkId: hex(r.bytes(20)),
    gas: r.u64(), payload: hex(r.vec()), storageMass: r.u64(), id: hex(r.bytes(32)),
  };
  if (r.pos !== bytes.length) throw new Error("borsh length");
  return obj;
}
function binding(covenant) {
  return new kaspa.CovenantBinding(covenant.authorizingInput, new kaspa.Hash(covenant.covenantId));
}
function materialize(obj) {
  const outputs = obj.outputs.map((o) => new kaspa.TransactionOutput(
    o.value,
    new kaspa.ScriptPublicKey(o.scriptPublicKey.version, o.scriptPublicKey.script),
    o.covenant ? binding(o.covenant) : null,
  ));
  const tx = new kaspa.Transaction({
    version: obj.version,
    inputs: obj.inputs,
    outputs,
    lockTime: obj.lockTime,
    subnetworkId: obj.subnetworkId,
    gas: obj.gas,
    payload: obj.payload,
    storageMass: obj.storageMass,
  });
  const live = tx.outputs;
  let patched = false;
  for (let i = 0; i < obj.outputs.length; i++) {
    if (obj.outputs[i].covenant && !live[i].covenant) {
      live[i].covenant = binding(obj.outputs[i].covenant);
      patched = true;
    }
  }
  if (patched) tx.outputs = live;
  return tx;
}
function already(message) {
  return /already (exists|in the mempool|in mempool|accepted|known)|duplicate transaction/i.test(message);
}

const rpc = new kaspa.RpcClient({ url, encoding: kaspa.Encoding.Borsh, networkId: "testnet-10" });
await rpc.connect({ timeoutDuration: 8000, blockAsyncConnect: true, strategy: "fallback" });
const si = await rpc.getServerInfo();
if (String(si.networkId) !== "testnet-10" || !si.isSynced || !si.hasUtxoIndex) {
  console.log("FAIL node");
  await rpc.disconnect();
  process.exit(2);
}
console.log("NODE ok url=" + url + " slowMs=" + slow);
const log = fs.createWriteStream(logPath, { flags: "a" });
let accepted = 0;
let streak = 0;
let index = 0;
let stop = "";
const lines = readline.createInterface({ input: fs.createReadStream(jsonl), crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.trim()) continue;
  index += 1;
  if (index > 1 && slow > 0) await new Promise((resolve) => setTimeout(resolve, slow));
  const row = JSON.parse(line);
  const rustId = String(row.tx.id);
  const obj = txFromBorsh(row.tx.borsh);
  const tx = materialize(obj);
  if (String(tx.id) !== rustId) {
    console.log("ID_MISMATCH index=" + index + " rust=" + rustId + " wasm=" + tx.id);
    stop = "id mismatch";
    break;
  }
  let ok = false;
  let error = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await rpc.submitTransaction({ transaction: tx, allowOrphan: false });
      ok = true;
      break;
    } catch (err) {
      error = String(err.message || err).replace(/\s+/g, " ").slice(0, 300);
      if (already(error)) { ok = true; break; }
      if (attempt < 3 && /orphan|not.?found|missing|outpoint/i.test(error)) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }
      break;
    }
  }
  log.write(JSON.stringify({ i: index, index: row.detail, txid: rustId, ok, fee: row.fee, storage: row.storage, error: ok ? "" : error }) + "\n");
  if (ok) {
    accepted += 1;
    streak = 0;
    console.log("PROGRESS accepted=" + accepted + " leaf=" + row.detail);
  } else {
    streak += 1;
    console.log("REJECT leaf=" + row.detail + " streak=" + streak + " " + error);
    if (streak >= 20) { stop = "20 consecutive rejects"; break; }
  }
}
if (!stop) stop = "file complete";
log.end();
await new Promise((resolve) => log.on("finish", resolve));
console.log("STOP " + stop);
console.log("DONE accepted=" + accepted + " seen=" + index);
await rpc.disconnect();
process.exit(stop === "file complete" ? 0 : 1);
