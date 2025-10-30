/**
 * collateral_ratio.ts
 * -------------------------------------------------------------------
 * Calculate the user's collateralization ratio for OFD CDP positions.
 * Formula: Ratio = (Collateral Value / Debt) * 100
 * Target > 150% to avoid liquidation (example value)
 *
 * Run: npx ts-node scripts/collateral_ratio.ts
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

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const cdpAbi = [
  "function getPosition(address) view returns(uint256 collateral, uint256 debt)"
];

const oraclelessPrice = 1; 
// OFD model is oracle-free, so we rely on over-collateralization with fixed safety assumptions

async function main() {
  console.log(`\n🏦 OFD — Collateral Ratio Calculator`);
  console.log(`👤 User: ${wallet.address}`);

  const cdpAddress = process.env.CDP_ADDRESS;
  if (!cdpAddress) throw new Error("❌ Missing CDP_ADDRESS in .env");

  const cdp = new ethers.Contract(cdpAddress, cdpAbi, provider);
  const [coll, debt] = await cdp.getPosition(wallet.address);

  const collateral = Number(ethers.formatUnits(coll, 18));
  const debtAmt = Number(ethers.formatUnits(debt, 18));

  if (debtAmt === 0) {
    console.log("✅ No debt position opened yet.");
    rl.close();
    return;
  }

  const collateralValue = collateral * oraclelessPrice;
  const ratio = (collateralValue / debtAmt) * 100;

  console.log(`\n📊 Position Summary`);
  console.log(`Collateral: ${collateral}`);
  console.log(`Debt:       ${debtAmt}`);
  console.log(`Ratio:      ${ratio.toFixed(2)}%`);

  if (ratio < 120) {
    console.log("❌ DANGER: HIGH LIQUIDATION RISK!");
  } else if (ratio < 150) {
    console.log("⚠️ WARNING: Top-up collateral soon.");
  } else {
    console.log("✅ SAFE: Position is healthy.");
  }

  rl.close();
}

main().catch(err => {
  console.error("❌ Error:", err);
  rl.close();
});
