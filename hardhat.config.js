require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [{ version: "0.8.19" }],
  },
  networks: {
    hedera_testnet: {
      url: process.env.HEDERA_RPC || "https://testnet.hashgraph.rpc",
      chainId: Number(process.env.HEDERA_CHAIN_ID || 296),
      accounts: process.env.HEDERA_PRIVATE_KEY
        ? [process.env.HEDERA_PRIVATE_KEY]
        : [],
    },
    localhost: { url: "http://127.0.0.1:8545" },
  },
  mocha: { timeout: 300000 },
};
