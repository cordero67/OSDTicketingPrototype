//const { assert } = require("chai");

//import { tokens } from "./helpers";
const Token = artifacts.require("./Token");

//require("chai").use(require("chai-as-promised")).should();

// Helper function
const tokens = (_number) => {
  //console.log("Input: ", _number);
  const result = web3.utils.toWei(_number.toString(), "ether");
  //console.log("Output: ", result);
  return result;
};

// injects all the accounts from ganache blockchain created locally
//contract("token", (accounts) => {
contract("Token", ([deployer, receiver, exchange]) => {
  let token;
  const name = "Blu Mun Token";
  const symbol = "BLMN";
  const decimals = "18";
  const totalSupply = tokens(1000000);

  beforeEach(async () => {
    token = await Token.new();
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      const result = await token.name();
      assert.equal(result, name, "the name is not registered");
      //result.should.equal(name);
    });

    it("tracks the symbol", async () => {
      const result = await token.symbol();
      assert.equal(result, symbol, "the symbol is not registered");
    });

    it("tracks the decimals", async () => {
      const result = await token.decimals();
      assert.equal(
        result.toString(),
        decimals,
        "the decimals is not registered"
      );
    });

    it("tracks the total supply", async () => {
      const result = await token.totalSupply();
      //console.log("result.toString(): ", result.toString());
      //console.log("totalSupply: ", totalSupply);
      assert.equal(result, totalSupply, "the totalSupply is not registered");
    });

    it("assigns the total token supply to the deployer", async () => {
      //const result = await token.balanceOf(accounts[0]);
      const result = await token.balanceOf(deployer);
      //console.log("result: ", result);
      //console.log("totalSupply: ", totalSupply);
      assert.equal(result, totalSupply, "totalSupply not sent to owner");
    });
  });

  describe("sending tokens", () => {
    let amount;
    let result;

    describe("successfull 'transfer()' transactions", () => {
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transfer(receiver, amount, {
          from: deployer,
        });
      });
      it("transfers token balances", async () => {
        let balance;
        //balance = await token.balanceOf(deployer);
        //console.log("deployer balance before: ", balance.toString());
        //balance = await token.balanceOf(receiver);
        //console.log("recipient balance before: ", balance.toString());

        balance = await token.balanceOf(deployer);
        //console.log("deployer balance after: ", balance.toString());
        assert.equal(balance, tokens(999900), "balance does not equal 999900");
        balance = await token.balanceOf(receiver);
        //console.log("recipient balance after: ", balance.toString());
        assert.equal(balance, tokens(100), "balance does not equal 100");
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Transfer",
          "should have fired a Transfer event"
        );
        //console.log("args.from: ", log.args.from);
        //console.log("args.to: ", log.args.to);
        assert.equal(
          log.args.from,
          deployer,
          "the from address should be deployer"
        );
        assert.equal(
          log.args.to,
          receiver,
          "the to address should be receiver"
        );
        assert.equal(log.args.value, amount, "the value amount should be 100");
      });
    });

    // NEED TO REVISIT THIS, video 42:45: Transfer Tokens
    // The try catch block is not correct nor are the tests
    describe("failed 'transfer()' transactions", () => {
      it("rejects insufficient balances", async () => {
        let invalidAmount;

        invalidAmount = tokens(0);

        let result = await token.balanceOf(receiver);
        //console.log("Result: ", result.toString());
        try {
          await token.transfer(deployer, invalidAmount, { from: receiver });
          //console.log("Amount is OK");
          assert(false);
        } catch (error) {
          //console.log("Error message: ", error.message);
          assert.equal(
            error.message,
            "Returned error: VM Exception while processing transaction: revert"
          );
        }

        try {
          await token.transfer(deployer, invalidAmount, { from: receiver });
          //console.log("Amount is OK");
          assert(false);
        } catch (error) {
          assert(error);
        }
        //console.log("Continuing");

        invalidAmount = tokens(1000000000000000);
        try {
          await token.transfer(receiver, invalidAmount, { from: deployer });
          //console.log("Amount is GOOD");
        } catch (error) {
          assert.equal(
            error.message,
            "Returned error: VM Exception while processing transaction: revert"
          );
        }
      });
      /*
      it("reject invalid address", async () => {
        let invalidAddress = 0x0;
        //let invalidAddress = exchange;

        try {
          await token.transfer(invalidAddress, amount, { from: deployer });
          console.log("Address is VALID");
        } catch (error) {
          assert.equal(
            error.message,
            'AssertionError: expected "invalid address (arg="_to", coderType="address", value=0)" to equal "invalid address (arg="_spender", coderType="address", value=0)'
          );
          console.log("Address is NOT VALID");
        }

        console.log("Goodbye");
      });
      */
    });
  });

  describe("approving tokens", () => {
    let amount;
    let result;

    amount = tokens(10);

    beforeEach(async () => {
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("successfull 'approve()' transactions", () => {
      it("allocates a token allowance for delegated spending on an exchange", async () => {
        const allowance = await token.allowance(deployer, exchange, {
          from: deployer,
        });
        //console.log("Hello");
        assert.equal(
          allowance,
          amount,
          "did not suscessfully record allowance amount"
        );
      });

      it("emits an Allocate event", async () => {
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Approval",
          "should have fired an Approval event"
        );
        //console.log("args.from: ", log.args.from);
        //console.log("args.to: ", log.args.to);
        assert.equal(
          log.args.owner,
          deployer,
          "the owner address should be deployer"
        );
        assert.equal(
          log.args.spender,
          exchange,
          "the spender address should be receiver"
        );
        assert.equal(log.args.value, amount, "the value amount should be 10");
      });
    });

    // NEED TO REVISIT THIS, video 13:35: Delegated TokenTransfers
    // The try catch block is not correct nor are the tests
    describe("failed approve transactions", () => {
      /*
      it("reject invalid address", async () => {
        let invalidAddress = 0x0;
        //let invalidAddress = exchange;

        try {
          await token.approve(invalidAddress, amount, { from: deployer });
          console.log("Address is VALID");
        } catch (error) {
          assert.equal(
            error.message,
            'invalid address (arg="_spender", coderType="address", value=0)'
          );
          console.log("Address is NOT VALID");
        }

        console.log("Goodbye");
      });
      */
    });
  });

  describe("delegated token transfers", () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = tokens(100);
      await token.approve(exchange, amount, { from: deployer });
    });

    describe("successfull 'transferFrom()' transactions", () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, amount, {
          from: exchange,
        });
      });
      it("transfers token balances", async () => {
        let balance;
        balance = await token.balanceOf(deployer);
        assert.equal(balance, tokens(999900), "balance does not equal 999900");
        balance = await token.balanceOf(receiver);
        assert.equal(balance, tokens(100), "balance does not equal 100");
      });

      it("emits another Transfer event", async () => {
        //console.log("Result: ", result);
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Transfer",
          "should have fired a Transfer event"
        );
        //console.log("args.from: ", log.args.from);
        //console.log("args.to: ", log.args.to);
        assert.equal(
          log.args.from,
          deployer,
          "the from address should be deployer"
        );
        assert.equal(
          log.args.to,
          receiver,
          "the to address should be receiver"
        );
        assert.equal(log.args.value, amount, "the value amount should be 100");
      });
    });

    // NEED TO REVISIT THIS, video 24:15: DelegatedToken Transfers
    // The try catch block is not correct nor are the tests
    describe("failed 'transferFrom()' transactions", () => {
      it("rejects insufficient allowance amounts", async () => {
        let invalidAmount;
        invalidAmount = tokens(1000000000000);
        let result;

        try {
          await token.transferFrom(deployer, receiver, invalidAmount, {
            from: exchange,
          });
        } catch (error) {
          //console.log("Error: ", error.message);

          assert.equal(
            error.message,
            "Returned error: VM Exception while processing transaction: revert",
            "properly stopped execution"
          );
        }
      });

      it("rejects invalid address", async () => {
        let invalidAddress = 0x0;

        try {
          await token.transfer(invalidAddress, amount, { from: deployer });
          console.log("Address is VALID");
        } catch (error) {
          //console.log("Error.message: ", error.message);

          assert.equal(
            error.message,
            'invalid address (arg="_to", coderType="address", value=0)',
            "should reject invalid address"
          );
        }
      });
    });
  });
});
