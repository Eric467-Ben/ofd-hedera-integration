/**
 * check_balance.ts
 * -----------------------------------------
 * Check wallet HBAR + OFD token balance
 */

import "dotenv/config";
import { ethers } from "ethers";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(q: string) {
  return new Promise<string>(resolve => rl.question(q, resolve));
}

async function main() {
  const RPC = process.env.RPC_URL;
  const PK = process.env.PRIVATE_KEY;

  if (!RPC || !PK) throw new Error("❌ Missing RPC_URL or PRIVATE_KEY in .env");

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);

  console.log(`🔐 Wallet: ${wallet.address}`);

  const hbarBalance = await provider.getBalance(wallet.address);
  console.log(`💰 HBAR Balance: ${ethers.formatEther(hbarBalance)} HBAR\n`);

  const ofdAddress = await ask("Enter OFD Token Address (or blank to skip): ");

  if (ofdAddress.trim() !== "") {
    const erc20Abi = [
      "function balanceOf(address) view returns(uint256)",
      "function symbol() view returns(string)"
    ];

    const token = new ethers.Contract(ofdAddress, erc20Abi, provider);
    const balance = await token.balanceOf(wallet.address);
    const symbol = await token.symbol();

    console.log(`🏷 Token: ${symbol}`);
    console.log(`🧮 Balance: ${ethers.formatUnits(balance, 18)} ${symbol}`);
  }

  rl.close();
}

main().catch(err => {
  console.error("❌ Error:", err);
  rl.close();
});
