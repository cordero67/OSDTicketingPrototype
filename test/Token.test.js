import { tokens, EVM_REVERT } from "./helpers";
const { default: Web3 } = require("web3");

const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

//contract("Token", (accounts) => {
contract("Token", ([deployer, receiver, exchange]) => {
  let token;

  const name = "OSD Token";
  const symbol = "OSD";
  const decimals = "18";
  const totalSupply = tokens(1000000).toString();

  beforeEach(async () => {
    //const contract = new web3.eth.Contract(abi, address3);
    token = await Token.new();
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      const result = await token.name();
      result.should.equal(name);
    });

    it("tracks the symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });

    it("tracks the decimals", async () => {
      const result = await token.decimals();
      result.toString().should.equal(decimals);
    });

    it("tracks the totalSupply", async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(totalSupply.toString());
    });

    it("assigns total supply to token creator", async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply.toString());
    });
  });

  describe("sending tokens", () => {
    let amount;
    let result;

    describe("success", () => {
      beforeEach(async () => {
        // make a transfer
        // result holds the transaction object
        amount = tokens(100);
        result = await token.transfer(receiver, amount, {
          from: deployer,
        });
      });

      it("transfers token balances", async () => {
        let balance;

        balance = await token.balanceOf(deployer);
        console.log("deployer balance after: ", balance.toString());
        balance.toString().should.equal(tokens(999900).toString());
        balance = await token.balanceOf(receiver);
        console.log("receiver balance after: ", balance.toString());
        balance.toString().should.equal(tokens(100).toString());
      });

      it("emits a Transfer event", async () => {
        // console.log(result);
        // console.log(result.logs);
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.toString().should.equal(deployer, "from is correct");
        event.to.toString().should.equal(receiver, "to is correct");
        event.value
          .toString()
          .should.equal(amount.toString(), "value is correct");
      });
    });

    describe("failure", () => {
      it("rejects insufficient balance", async () => {
        let invalidAmount;
        invalidAmount = tokens(100000000);
        await token
          .transfer(receiver, invalidAmount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);

        await token
          .transfer(deployer, invalidAmount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipient", async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be
          .rejected;
      });
    });
  });

  describe("approving tokens", () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {
      it("allocates an allowance for delegated token spending on an exchange", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal(amount.toString());
      });

      it("emits an Approval event", async () => {
        // console.log(result);
        // console.log(result.logs);
        const log = result.logs[0];
        log.event.should.equal("Approval");
        const event = log.args;
        event.owner.toString().should.equal(deployer, "owner is correct");
        event.spender.toString().should.equal(exchange, "spender is correct");
        event.value
          .toString()
          .should.equal(amount.toString(), "value is correct");
      });
    });

    describe("failure", () => {
      it("rejects invalid recipient", async () => {
        await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
      });
    });
  });

  describe("delegated token transfers", () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = tokens(100);
      await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {
      beforeEach(async () => {
        // make a transfer
        // result holds the transaction object
        result = await token.transferFrom(deployer, receiver, tokens(90), {
          from: exchange,
        });
      });

      it("transfers token balances", async () => {
        let balance;

        balance = await token.balanceOf(deployer);
        console.log("deployer balance after: ", balance.toString());
        balance.toString().should.equal(tokens(999910).toString());
        balance = await token.balanceOf(receiver);
        console.log("receiver balance after: ", balance.toString());
        balance.toString().should.equal(tokens(90).toString());
      });

      it("resets the allowance", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal(tokens(10).toString());
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.toString().should.equal(deployer, "from is correct");
        event.to.toString().should.equal(receiver, "to is correct");
        event.value
          .toString()
          .should.equal(tokens(90).toString(), "value is correct");
      });
    });

    describe("failure", () => {
      it("rejects insufficient amounts", async () => {
        let invalidAmount;
        invalidAmount = tokens(100000000);
        await token
          .transferFrom(deployer, receiver, invalidAmount, { from: exchange })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipient", async () => {
        await token.transferFrom(deployer, 0x0, amount, { from: exchange })
          .should.be.rejected;
      });
    });
  });
});
