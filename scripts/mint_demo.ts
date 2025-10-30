/**
 * mint_demo.ts
 * ----------------------------------------------
 * Professional demo script for safely minting tokens
 * using Ethers.js v6 on Node.js 22.
 *
 * NOTE: Replace CONTRACT_ADDRESS + ABI with your project version.
 */

import "dotenv/config";
import { ethers } from "ethers";
import chalk from "chalk";
import ora from "ora";

// ============= CONFIG =============

const CONTRACT_ADDRESS = "0xYourContractAddressHere"; // ✅ Change this
const MINT_AMOUNT = ethers.parseUnits("1000", 18);    // ✅ 1000 tokens
const RECEIVER = "0xReceiverWalletHere";              // ✅ Change

// Minimal ERC-20 ABI with mint()
const CONTRACT_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address wallet) view returns (uint256)"
];

// ============= MAIN =============

(async () => {
  const spinner = ora("Initializing mint demo...").start();

  try {
    if (!process.env.PRIVATE_KEY || !process.env.RPC_URL) {
      spinner.fail("Missing environment variables.");
      console.log(chalk.red("Ensure PRIVATE_KEY and RPC_URL exist in your .env"));
      process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    spinner.succeed(`Wallet connected: ${wallet.address}`);

    console.log(chalk.blue("\n📦 Fetching initial balance..."));
    const before = await contract.balanceOf(RECEIVER);
    console.log(`Balance before mint: ${ethers.formatUnits(before, 18)} tokens\n`);

    spinner.start(`Minting ${ethers.formatUnits(MINT_AMOUNT, 18)} tokens to ${RECEIVER}...`);

    const tx = await contract.mint(RECEIVER, MINT_AMOUNT);
    spinner.text = "Waiting for blockchain confirmation…";
    await tx.wait(1);

    spinner.succeed("✅ Mint transaction confirmed!");

    const after = await contract.balanceOf(RECEIVER);
    console.log(
      chalk.green(
        `\n🎉 Mint Success!\n` +
        `➡️ Tokens Minted: ${ethers.formatUnits(MINT_AMOUNT, 18)}\n` +
        `📬 Receiver: ${RECEIVER}\n` +
        `💰 New Balance: ${ethers.formatUnits(after, 18)} tokens\n`
      )
    );

  } catch (err: any) {
    spinner.fail("❌ Error during mint");
    console.error(chalk.red(err.message ?? err));
  }
})();
