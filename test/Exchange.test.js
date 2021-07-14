import { tokens, ether, EVM_REVERT } from "./helpers";
const { default: Web3 } = require("web3");

const Exchange = artifacts.require("./Exchange");
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let token;
  let exchange;
  const feePercent = 10;
  const totalSupply = 1000000;
  const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    // Deploy Token contract
    token = await Token.new();
    // transfer tokens form deployer to user1
    await token.transfer(user1, tokens(100), { from: deployer });
    // Deploy Exchange contract
    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("deployment", () => {
    it("tracks the feeAccount", async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });

    it("tracks the feePercent", async () => {
      const result = await exchange.feePercent();
      result.toString().should.equal(feePercent.toString());
    });
  });

  describe("Fallback function", () => {
    it("revert if ether is sent", async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("depositing Ether", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(1);
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    it("tracks ether deposits", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });

    it("emits a Deposit event", async () => {
      //console.log(result.logs);
      const log = result.logs[0];
      log.event.should.equal("Deposit");
      const event = log.args;
      event.token
        .toString()
        .should.equal(ETHER_ADDRESS, "token address is correct");
      event.user.toString().should.equal(user1, "user address is correct");
      event.amount
        .toString()
        .should.equal(amount.toString(), "amount is correct");
      event.balance
        .toString()
        .should.equal(amount.toString(), "exchange balance is correct");
    });
  });

  describe("withdraw Ether", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(1);
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    describe("success", () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, {
          from: user1,
        });
      });

      it("withdraw Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        //console.log(result.logs);
        const log = result.logs[0];
        log.event.should.equal("Withdrawal");
        const event = log.args;
        event.token
          .toString()
          .should.equal(ETHER_ADDRESS, "token address is correct");
        event.user.toString().should.equal(user1, "user address is correct");

        event.amount
          .toString()
          .should.equal(amount.toString(), "amount is correct");

        event.balance
          .toString()
          .should.equal("0", "exchange balance is correct");
      });
    });

    describe("failure", () => {
      it("rejects withdrawals for insufficient balances", async () => {
        await exchange
          .withdrawEther(tokens(100), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("depositing tokens", () => {
    let result;
    let amount;

    describe("success", () => {
      let balance;

      beforeEach(async () => {
        amount = tokens(10);
        // states that exchange.address can spend the tokens of user1
        await token.approve(exchange.address, amount, { from: user1 });
        // within the token.address contract, an amount of tokens is transferred
        // form user1 to the exchange
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });

      it("tracks token deposit", async () => {
        // check the exchange's balance of tokens in the token contract
        balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        // check the exchange's balance of tokens on the exchange
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it("emits a Deposit event", async () => {
        //console.log(result.logs);
        const log = result.logs[0];
        log.event.should.equal("Deposit");
        const event = log.args;
        event.token
          .toString()
          .should.equal(token.address, "token address is correct");
        event.user.toString().should.equal(user1, "user address is correct");
        event.amount
          .toString()
          .should.equal(amount.toString(), "amount is correct");
        event.balance
          .toString()
          .should.equal(amount.toString(), "exchange balance is correct");
      });
    });

    describe("failure", async () => {
      it("fails when attempting to deposit Ether", async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, amount, {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("fails when no tokens are approved", async () => {
        await exchange
          .depositToken(token.address, amount, {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("withdraw tokens", () => {
    let result;
    let amount;

    describe("success", () => {
      beforeEach(async () => {
        amount = tokens(10);
        // this makes the initial token deposit to set up the withdrawal test
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, {
          from: user1,
        });
        // this then makes a withdrawal of these tokens
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });

      it("withdraw token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        //console.log(result.logs);
        const log = result.logs[0];
        log.event.should.equal("Withdrawal");
        const event = log.args;

        event.token
          .toString()
          .should.equal(token.address, "token address is correct");
        event.user.toString().should.equal(user1, "user address is correct");

        event.amount
          .toString()
          .should.equal(amount.toString(), "amount is correct");

        event.balance
          .toString()
          .should.equal("0", "exchange balance is correct");
      });
    });

    describe("failure", () => {
      it("rejects Ether withdrawals", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, tokens(10), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("rejects withdrawals for insufficient balances", async () => {
        await exchange
          .withdrawToken(token.address, tokens(10), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("check balances", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(1);
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    it("checks balances", async () => {
      result = await exchange.balanceOf(ETHER_ADDRESS, user1);

      result.toString().should.equal(tokens(1).toString());
    });
  });

  describe("making orders", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(1);
      result = await exchange.makeOrder(
        token.address,
        amount,
        ETHER_ADDRESS,
        amount,
        {
          from: user1,
        }
      );
    });

    it("tracks new order", async () => {
      const orderCount = await exchange.orderCount();
      orderCount.toString().should.equal("1");
      const order = await exchange.orders("1");
      order.id.toString().should.equal("1", "id is correct");
      order.user.toString().should.equal(user1, "user is correct");
      order.tokenGet
        .toString()
        .should.equal(token.address, "tokenGet is correct");
      order.amountGet
        .toString()
        .should.equal(tokens(1).toString(), "amountGet is correct");
      order.tokenGive
        .toString()
        .should.equal(ETHER_ADDRESS, "tokenGive is correct");
      order.amountGive
        .toString()
        .should.equal(tokens(1).toString(), "amountGive is correct");
      order.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is present");
    });

    it("emits an Order event", async () => {
      //console.log(result.logs);
      const log = result.logs[0];
      log.event.should.equal("Order");
      const event = log.args;

      event.id.toString().should.equal("1", "id address is correct");
      event.user.toString().should.equal(user1, "user address is correct");
      event.tokenGet
        .toString()
        .should.equal(token.address, "tokenGet address is correct");
      event.amountGet
        .toString()
        .should.equal(tokens(1).toString(), "amountGet amount is correct");
      event.tokenGive
        .toString()
        .should.equal(ETHER_ADDRESS, "tokenGive address is correct");
      event.amountGive
        .toString()
        .should.equal(tokens(1).toString(), "tokenGive amount is correct");
      event.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is present");
    });
  });

  describe("order actions", () => {
    beforeEach(async () => {
      // user1 deposits ETHER into exchange
      await exchange.depositEther({ from: user1, value: tokens(1) });
      // give user2 some tokens
      await token.transfer(user2, tokens(100), { from: deployer });
      // user2 allows exchange to transfer/spend some of its tokens
      await token.approve(exchange.address, tokens(2), { from: user2 });
      // user2 deposits tokens into exchange
      await exchange.depositToken(token.address, tokens(2), { from: user2 });
      // creates test order
      await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        tokens(1),
        { from: user1 }
      );
    });

    describe("cancel order", () => {
      let result;

      describe("success", () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("order is in ordersCancelled", async () => {
          let cancelled = await exchange.ordersCancelled(1);
          cancelled.should.equal(true, "order was cancelled");
        });

        it("emits a Cancel event", async () => {
          //console.log(result.logs);
          const log = result.logs[0];
          log.event.should.equal("Cancel");
          const event = log.args;

          event.id.toString().should.equal("1", "id address is correct");
          event.user.toString().should.equal(user1, "user address is correct");
          event.tokenGet
            .toString()
            .should.equal(token.address, "tokenGet address is correct");
          event.amountGet
            .toString()
            .should.equal(tokens(1).toString(), "amountGet amount is correct");
          event.tokenGive
            .toString()
            .should.equal(ETHER_ADDRESS, "tokenGive address is correct");
          event.amountGive
            .toString()
            .should.equal(tokens(1).toString(), "tokenGive amount is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is present");
        });
      });

      describe("failure", () => {
        it("rejects an invalid order", async () => {
          await exchange
            .cancelOrder("999", { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects an unauthorized order", async () => {
          await exchange
            .cancelOrder("1", { from: deployer })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });

    describe("fill order", () => {
      let result;

      describe("success", () => {
        beforeEach(async () => {
          // user2 fills the order
          result = await exchange.fillOrder("1", { from: user2 });
        });
        it("executes trade and charges fees", async () => {
          let balance;
          balance = await exchange.balanceOf(token.address, user1); //
          balance
            .toString()
            .should.equal(
              tokens(1).toString(),
              "user1 Token balance is correct"
            );

          balance = await exchange.balanceOf(ETHER_ADDRESS, user2); //
          balance
            .toString()
            .should.equal(
              tokens(1).toString(),
              "user2 ETHER balance is correct"
            );

          balance = await exchange.balanceOf(ETHER_ADDRESS, user1); //
          balance
            .toString()
            .should.equal("0", "user1 ETHER balance is correct");

          balance = await exchange.balanceOf(token.address, user2); //
          balance
            .toString()
            .should.equal(
              tokens(0.9).toString(),
              "user2 Token balance is correct"
            );
          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          balance
            .toString()
            .should.equal(
              tokens(0.1).toString(),
              "feeAccount Token balance is correct"
            );
        });

        it("updates filled orders", async () => {
          let orderFilled = await exchange.ordersFilled("1");
          orderFilled.should.equal(true, "order was filled");
        });

        it("emits a Trade event", async () => {
          //console.log(result.logs);
          const log = result.logs[0];
          log.event.should.equal("Trade");
          const event = log.args;

          event.id.toString().should.equal("1", "id address is correct");
          event.user.toString().should.equal(user1, "user address is correct");
          event.tokenGet
            .toString()
            .should.equal(token.address, "tokenGet address is correct");
          event.amountGet
            .toString()
            .should.equal(tokens(1).toString(), "amountGet amount is correct");
          event.tokenGive
            .toString()
            .should.equal(ETHER_ADDRESS, "tokenGive address is correct");
          event.amountGive
            .toString()
            .should.equal(tokens(1).toString(), "tokenGive amount is correct");
          event.userFill
            .toString()
            .should.equal(user2, "user address is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is present");
        });
      });

      describe("failure", () => {
        it("rejects an invalid order id", async () => {
          await exchange
            .fillOrder("999", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects an already filled order", async () => {
          await exchange.fillOrder("1", { from: user2 }).should.be.fulfilled;
          await exchange
            .fillOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects cancelled order", async () => {
          await exchange.cancelOrder("1", { from: user1 }).should.be.fulfilled;
          await exchange
            .fillOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });
});
