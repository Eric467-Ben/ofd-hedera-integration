import fs from "fs";
import snarkjs from "snarkjs";
import path from "path";

const vkeyFile = path.join(__dirname, "../../circuits/verification_key.json");
const proofFile = path.join(__dirname, "../../proof.json");
const publicFile = path.join(__dirname, "../../public.json");

async function main() {
  const vKey = JSON.parse(fs.readFileSync(vkeyFile).toString());
  const proof = JSON.parse(fs.readFileSync(proofFile).toString());
  const publicSignals = JSON.parse(fs.readFileSync(publicFile).toString());

  console.log("Verifying proof...");
  const result = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  if (result) console.log("✅ Valid proof!");
  else console.log("❌ Invalid proof");
}

main();
