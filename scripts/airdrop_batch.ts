/**
 * airdrop_batch.ts
 * -----------------------------------------------------
 * Batch-airdrop OFD (or any ERC20 token) to many wallets
 *
 * ✅ Reads from recipients.csv
 * ✅ Uses Ethers v6
 * ✅ Shows transaction progress + summary
 */

import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import csv from "csv-parser";

const TOKEN_ADDRESS = process.env.OFD_ADDRESS; // 👈 auto-reads from env

if (!process.env.PRIVATE_KEY || !process.env.RPC_URL)
  throw new Error("❌ Missing PRIVATE_KEY or RPC_URL in .env");

if (!TOKEN_ADDRESS) throw new Error("❌ Set OFD_ADDRESS in .env");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const erc20Abi = [
  "function balanceOf(address) view returns(uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function symbol() view returns (string)"
];

const token = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);

// CSV format: address,amount
let recipients: { address: string; amount: string }[] = [];

async function loadRecipients() {
  return new Promise<void>((resolve) => {
    fs.createReadStream("recipients.csv")
      .pipe(csv())
      .on("data", (row) => recipients.push(row))
      .on("end", resolve);
  });
}

async function main() {
  console.log(`\n🚀 Starting OFD Airdrop`);
  console.log(`🔑 Sender: ${wallet.address}`);
  console.log(`🏦 Token: ${TOKEN_ADDRESS}\n`);

  await loadRecipients();
  if (recipients.length === 0) throw new Error("⚠️ recipients.csv empty!");

  const symbol = await token.symbol();
  const total = recipients.length;

  console.log(`📋 Loaded ${total} recipients`);
  console.log(`🪙 Token Symbol: ${symbol}\n`);

  for (let i = 0; i < total; i++) {
    const { address, amount } = recipients[i];

    console.log(`➡️ Sending ${amount} ${symbol} → ${address}`);

    const tx = await token.transfer(
      address,
      ethers.parseUnits(amount, 18)
    );

    console.log(`   ⏳ TxHash: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Confirmed\n`);
  }

  console.log(`🎉 Airdrop complete!`);
}

main().catch((err) => console.error("❌ ERROR:", err));
