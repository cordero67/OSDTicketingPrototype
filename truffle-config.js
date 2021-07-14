require("babel-register");
require("babel-polyfill");
require("dotenv").config();

module.exports = {
  // specifies a new network setting, a development network
  // these are the specifications idenitified by ganache
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis",

  // Configure your compilers
  compilers: {
    // specifies the solidity compiler to be used
    // javasciprt version of a solidity compiler
    solc: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
