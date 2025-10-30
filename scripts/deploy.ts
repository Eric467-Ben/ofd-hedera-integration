import 'dotenv/config';
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('🚀 Deploying with account:', deployer.address);

  // Deploy OFD Stablecoin Contract
  const OFD = await ethers.getContractFactory('OFD');
  const ofd = await OFD.deploy(deployer.address);
  await ofd.waitForDeployment();
  const ofdAddress = await ofd.getAddress();
  console.log('✅ OFD deployed at:', ofdAddress);

  // Deploy Auction Contract
  const Auction = await ethers.getContractFactory('Auction');
  const auction = await Auction.deploy();
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log('✅ Auction deployed at:', auctionAddress);

  // Deploy CDP Manager
  const CDP = await ethers.getContractFactory('CDPManager');
  const cdp = await CDP.deploy(ofdAddress, auctionAddress);
  await cdp.waitForDeployment();
  const cdpAddress = await cdp.getAddress();
  console.log('✅ CDPManager deployed at:', cdpAddress);

  console.log('\n🎯 Deployment complete. Add these to your .env:\n');
  console.log(`OFD_ADDRESS=${ofdAddress}`);
  console.log(`AUCTION_ADDRESS=${auctionAddress}`);
  console.log(`CDP_ADDRESS=${cdpAddress}`);
  console.log('\n✨ Ready to run mint script next.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
