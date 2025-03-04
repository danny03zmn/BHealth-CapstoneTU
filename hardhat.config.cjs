require("@nomiclabs/hardhat-ethers");

module.exports = {
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/cae26b20df414310a789de24a9cc8238",
      accounts: ["ab31e1a5fb053d6c7e970c90e5046f7536bb1b6638c62f15510e28a518442ad0"],
    }
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};