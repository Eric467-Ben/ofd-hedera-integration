/**
 * deploy_contract.ts
 * ------------------------------------------------
 * Universal deployment script for Hardhat + Ethers v6
 * Usage: npm run ts scripts/deploy_contract.ts
 */

import "dotenv/config";
import { ethers } from "ethers";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";

// ----- CONFIG -----
const CONTRACT_NAME = "CDPManager"; // ✅ Set your contract name

// ----- SCRIPT -----
(async () => {
  const spinner = ora(`Deploying ${CONTRACT_NAME}...`).start();

  try {
    if (!process.env.PRIVATE_KEY || !process.env.RPC_URL) {
      spinner.fail("Missing environment variables.");
      console.log(chalk.red("➡️ Ensure PRIVATE_KEY and RPC_URL are in .env"));
      process.exit(1);
    }

    // Read Hardhat build artifact
    const artifactPath = path.join(
      __dirname,
      `../artifacts/contracts/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json`
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );

    spinner.text = "Sending deployment tx…";

    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    spinner.succeed(chalk.green(`✅ Contract deployed!`));

    console.log(`
📌 ${CONTRACT_NAME} Deployment Summary
------------------------------------
🟢 Network: ${process.env.RPC_URL}
📬 Deployer: ${wallet.address}
🏦 Contract Address: ${address}
`);

    fs.writeFileSync(
      `deployments_${CONTRACT_NAME}.txt`,
      `Contract Address: ${address}\nDeployed By: ${wallet.address}`
    );

    console.log(chalk.blue(`📁 Saved -> deployments_${CONTRACT_NAME}.txt\n`));
  } catch (err: any) {
    spinner.fail("❌ Deployment failed");
    console.log(chalk.red(err.message ?? err));
  }
})();
