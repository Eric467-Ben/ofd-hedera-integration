/**
 * liquidation_sim.ts
 * -------------------------------------------------------------------
 * Oracle-free CDP liquidation simulation for OFD on Hedera.
 *
 * Since OFD is oracle-free, we simulate hypothetical collateral price
 * moves and evaluate liquidation conditions under deterministic logic
 * + fixed risk assumptions.
 *
 * > Visualizes how OFD remains safe without price feeds.
 *
 * Run: npx ts-node scripts/liquidation_sim.ts
 */

import "dotenv/config";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const cdpAbi = [
  "function getPosition(address) view returns(uint256 collateral, uint256 debt)"
];

const LIQUIDATION_THRESHOLD = 1.5; // 150% CR target (example)
const STEPS = [1, 0.9, 0.8, 0.7, 0.6, 0.5]; 
// 1 = 100% (no change) → 50% crash

async function main() {
  const cdpAddress = process.env.CDP_ADDRESS;
  if (!cdpAddress) throw new Error("❌ Missing CDP_ADDRESS in .env");

  const cdp = new ethers.Contract(cdpAddress, cdpAbi, provider);
  const [collRaw, debtRaw] = await cdp.getPosition(wallet.address);

  const collateral = Number(ethers.formatUnits(collRaw, 18));
  const debt = Number(ethers.formatUnits(debtRaw, 18));

  if (debt === 0) {
    console.log("⚠️ No CDP debt found. Open a position first.");
    return;
  }

  console.log(`
🏦 OFD Liquidation Simulation
👤 User: ${wallet.address}
📊 Starting Position:
  Collateral:  ${collateral}
  Debt:        ${debt}
  Starting CR: ${(collateral / debt * 100).toFixed(2)}%
----------------------------------------------------`);

  console.log("📉 Simulating collateral collapse...");

  for (const drop of STEPS) {
    const simulatedValue = collateral * drop;
    const ratio = (simulatedValue / debt) * 100;

    const status =
      ratio < LIQUIDATION_THRESHOLD * 100
        ? "💀 LIQUIDATION TRIGGERED"
        : "✅ SAFE";

    console.log(`
Market Drop: ${(drop * 100).toFixed(0)}%
Collateral Value: ${simulatedValue.toFixed(3)}
CR: ${ratio.toFixed(2)}%
Status: ${status}
`);
  }

  console.log("✅ Simulation complete.\n");
  console.log("📎 Insight: OFD safety relies on over-collateralization + deterministic guards.");
}

main().catch(err => console.error("❌ Error:", err));
