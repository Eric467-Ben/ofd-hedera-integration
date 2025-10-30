import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import snarkjs from 'snarkjs';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const depositFile = path.join(__dirname, "../data/deposits.csv");
const wasmFile = path.join(__dirname, "../../circuits/commit.wasm");
const zkeyFile = path.join(__dirname, "../../circuits/commit.zkey");
const outputProof = path.join(__dirname, "../../proof.json");
const outputPublic = path.join(__dirname, "../../public.json");

async function getDeposit(owner: string, amount: string) {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(depositFile)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const match = rows.find(r => r.owner === owner && r.amount === amount);

        if (!match) reject("Deposit not found in ledger.");
        else resolve(match);
      });
  });
}

async function main() {
  const owner = process.argv[2];
  const amount = process.argv[3];
  const secret = process.argv[4];

  if (!owner || !amount || !secret) {
    console.log("Usage: ts-node prove.ts <owner> <amount> <secret>");
    process.exit(1);
  }

  console.log("Reading deposit from local ledger...");
  const deposit: any = await getDeposit(owner, amount);

  const input = {
    owner: ethers.keccak256(Buffer.from(owner)),
    amount: Number(deposit.amount),
    secret: Number(secret)
  };

  console.log("Generating ZK proof...");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFile, zkeyFile);

  fs.writeFileSync(outputProof, JSON.stringify(proof));
  fs.writeFileSync(outputPublic, JSON.stringify(publicSignals));

  console.log("\n✅ Proof generated!");
  console.log("→ proof.json");
  console.log("→ public.json");
}

main().catch(console.error);
