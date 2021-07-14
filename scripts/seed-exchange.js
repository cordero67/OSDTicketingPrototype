// build specifically for truffle's script runner

const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();

    const token = await Token.deployed();
    console.log("token contract: ", token.address);

    const exchange = await Exchange.deployed();
    console.log("exchange contract: ", exchange.address);

    console.log("Script running");
  } catch (error) {
    console.log(error);
  }
  callback();
};
