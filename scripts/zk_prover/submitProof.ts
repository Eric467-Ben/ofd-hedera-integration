import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const proof = JSON.parse(fs.readFileSync("proof.json").toString());
const publicSignals = JSON.parse(fs.readFileSync("public.json").toString());

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.HEDERA_RPC);
  const wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const contractAddress = process.env.CDP_CONTRACT;
  const abi = JSON.parse(fs.readFileSync("artifacts/contracts/CDPManager.sol/CDPManager.json").toString()).abi;
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log("Submitting proof to Hedera...");
  const tx = await contract.unlockFunds(
    proof.pi_a,
    proof.pi_b,
    proof.pi_c,
    publicSignals
  );

  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Funds unlocked!");
}

main();
