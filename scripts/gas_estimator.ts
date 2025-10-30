/**
 * gas_estimator.ts
 * ------------------------------------------------------
 * Estimates gas cost for mint / transfer / CDP open tx 
 * using Ethers v6 on Hedera JSON RPC
 *
 * Run: npx ts-node scripts/gas_estimator.ts
 */

import "dotenv/config";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.PRIVATE_KEY;
const OFD_ADDRESS = process.env.OFD_ADDRESS;
const CDP_ADDRESS = process.env.CDP_ADDRESS;

if (!privateKey || !process.env.RPC_URL) {
  throw new Error("❌ Missing PRIVATE_KEY or RPC_URL in .env");
}

const wallet = new ethers.Wallet(privateKey, provider);

// minimal ABIs for gas simulation
const erc20Abi = [
  "function transfer(address,uint256) returns(bool)",
  "function mint(address,uint256)"
];

const cdpAbi = [
  "function openPosition(uint256 collateralAmount, uint256 debtAmount)"
];

async function estimate() {
  console.log(`\n🧠 Gas Estimator — Hedera x OFD`);
  console.log(`👤 Wallet: ${wallet.address}\n`);

  // ----- TRANSFER -----
  if (OFD_ADDRESS) {
    const token = new ethers.Contract(OFD_ADDRESS, erc20Abi, wallet);

    const transferGas = await token.transfer.estimateGas(
      wallet.address,
      ethers.parseUnits("1", 18)
    );

    const fee = (Number(transferGas) / 1e8).toFixed(6);

    console.log(`💡 Transfer Gas Estimate:
    Gas Units:  ${transferGas}
    Est HBAR:   ${fee}
  `);
  }

  // ----- CDP OPEN -----
  if (CDP_ADDRESS) {
    const cdp = new ethers.Contract(CDP_ADDRESS, cdpAbi, wallet);

    const cdpGas = await cdp.openPosition.estimateGas(
      ethers.parseUnits("1", 18),
      ethers.parseUnits("0.5", 18)
    );

    const fee = (Number(cdpGas) / 1e8).toFixed(6);

    console.log(`🏦 CDP Open Estimate:
    Gas Units:  ${cdpGas}
    Est HBAR:   ${fee}
  `);
  }

  console.log(`✅ Estimation Finished\n`);
}

estimate().catch((e) => console.error("❌ Error:", e));
