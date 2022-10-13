import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"
import { parseTokenUnits } from "./utils"

describe('Exchange', () => {

  let exchange: Contract
  let token1: Contract
  let token2: Contract

  let accounts: SignerWithAddress[]
  let deployer: SignerWithAddress
  let feeAccount: SignerWithAddress
  let user1 : SignerWithAddress
  let user2 : SignerWithAddress

  let feePercent: number

  let token1Data = {
    name: 'Token1',
    symbol: 'T1',
    totalSupply: 1000000,
  }

  let token2Data = {
    name: 'Token2',
    symbol: 'T2',
    totalSupply: 1000000,
  }

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]
    user2 = accounts[3]
    feePercent = 10

    const Exchange = await ethers.getContractFactory('Exchange')
    exchange = await Exchange.deploy(feeAccount.address, feePercent)

    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy(token1Data.name, token1Data.symbol, token1Data.totalSupply)
    token2 = await Token.deploy(token2Data.name, token2Data.symbol, token2Data.totalSupply)
  })

  describe('Deployment', () => {

    it('should tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.be.eq(feeAccount.address)
    })

    it('should tracks the fee percent value', async () => {
      expect(await exchange.feePercent()).to.be.eq(feePercent)
    })

  })

  describe('Depositing', () => {

    describe('Success', () => {

      let amount: BigNumber
      beforeEach(async () => {
        amount = parseTokenUnits(100)
        await token1.transfer(user1.address, amount)
        await token1.connect(user1).approve(exchange.address, amount)
      })

      it('should be possible to deposit tokens', async () => {
        expect(await token1.balanceOf(exchange.address)).to.be.eq(0)
        expect(await exchange.connect(user1).depositToken(token1.address, amount)).to.be.ok
        expect(await exchange.balanceOf(token1.address, user1.address)).to.be.eq(amount)
        expect(await token1.balanceOf(exchange.address)).to.be.eq(amount)
      })

      it('should emits a Deposit event', async () => {
        const transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        const result = await transaction.wait()
        const { events } = result
        const [_transferEvent, depositEvent] = events!

        expect(events?.length).to.be.eq(2)
        expect(depositEvent.event).to.be.eq('Deposit')
        expect(depositEvent.args!.token).to.be.eq(token1.address)
        expect(depositEvent.args!.user).to.be.eq(user1.address)
        expect(depositEvent.args!.amount).to.be.eq(amount)
        expect(depositEvent.args!.balance).to.be.eq(
          await exchange.balanceOf(token1.address, user1.address)
        )
      })

    })

    describe('Failure', () => {

      it('should fail when no tokens are approved', async () => {

        let amount = parseTokenUnits(100)

        await token1.transfer(user1.address, amount)
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount)
        ).to.be.reverted

        expect(await exchange.balanceOf(token1.address, user1.address)).to.be.eq(0)

      })

    })

  })

  describe('Checking balances', () => {

    it('should return the correct user balance', async () => {
      const randomAmount = Math.floor((Math.random() * 100) + 1)
      const amount = parseTokenUnits(randomAmount)

      await token1.connect(deployer).approve(exchange.address, amount)
      await exchange.connect(deployer).depositToken(token1.address, amount)

      expect(await exchange.balanceOf(token1.address, deployer.address)).to.be.eq(amount)
    })

  })

  describe('Withdrawing', () => {

    describe('Success', () => {

      let amount: BigNumber
      beforeEach(async () => {
        amount = parseTokenUnits(100)
        await token1.transfer(user1.address, amount)
        await token1.connect(user1).approve(exchange.address, amount)
        await exchange.connect(user1).depositToken(token1.address, amount)
      })

      it('should be possible to withdraw tokens', async () => {
        expect(await token1.balanceOf(exchange.address)).to.be.eq(amount)
        expect(await exchange.connect(user1).balanceOf(token1.address, user1.address)).to.be.eq(amount)
        expect(await exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.ok
        expect(await exchange.connect(user1).balanceOf(token1.address, user1.address)).to.be.eq(0)
        expect(await token1.balanceOf(exchange.address)).to.be.eq(0)
      })

      it('should emits a Withdraw event', async () => {
        const transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
        const result = await transaction.wait()

        const { events } = result
        const [_, tranferEvent] = events!
        expect(events?.length).to.be.eq(2)
        expect(tranferEvent.event).to.be.eq('Withdraw')
        expect(tranferEvent.args!.token).to.be.eq(token1.address)
        expect(tranferEvent.args!.user).to.be.eq(user1.address)
        expect(tranferEvent.args!.amount).to.be.eq(amount)
        expect(tranferEvent.args!.balance).to.be.eq(0)
      })

    })

    describe('Failure', () => {

      it('should fail for insufficient balance', async () => {
        await expect(exchange
          .connect(user1)
          .withdrawToken(token1.address, parseTokenUnits(100))
        ).to.be.revertedWith('insufficient balance')
      })

    })

  })

  describe('Making orders', () => {

    describe('success', () => {

      beforeEach(async () => {
        await token1.connect(deployer).transfer(user1.address, parseTokenUnits(100))
        await token1.connect(user1).approve(exchange.address, parseTokenUnits(100))
        await exchange.connect(user1).depositToken(token1.address, parseTokenUnits(100))
      })

      it('should be possible to make an order', async () => {
        expect(await exchange.orderCount()).to.be.eq(0)

        const transaction = await exchange.connect(user1).makeOrder(
          token2.address,
          parseTokenUnits(50),
          token1.address,
          parseTokenUnits(100),
        )

        await transaction.wait()

        const order = await exchange.orders(1)

        expect(await exchange.orderCount()).to.be.eq(1)

        expect(order.id).to.be.ok
        expect(order.user).to.be.eq(user1.address)
        expect(order.tokenGet).to.be.eq(token2.address)
        expect(order.amountGet).to.be.eq(parseTokenUnits(50))
        expect(order.tokenGive).to.be.eq(token1.address)
        expect(order.amountGive).to.be.eq(parseTokenUnits(100))
        expect(order.timestamp).to.be.ok
      })

      it('should emits a OrderCreated event', async () => {
        const transaction = await exchange.connect(user1).makeOrder(
          token2.address,
          parseTokenUnits(50),
          token1.address,
          parseTokenUnits(100),
        )

        const result = await transaction.wait()
        const { events } = result
        const [makeOrderEvent] = events!

        expect(events?.length).to.be.eq(1)
        expect(makeOrderEvent.event).to.be.eq('OrderCreated')
      })

    })

    describe('failure', () => {

      it('should reverts for insufficient balance', async () => {
        await expect(exchange.connect(user1).makeOrder(
          token2.address,
          parseTokenUnits(50),
          token1.address,
          parseTokenUnits(100),
        )).to.be.revertedWith('insufficient balance')
      })

    })

  })

  describe('Canceling orders', () => {

    beforeEach(async () => {
      await token1.connect(deployer).transfer(user1.address, parseTokenUnits(100))
      await token1.connect(user1).approve(exchange.address, parseTokenUnits(100))
      await exchange.connect(user1).depositToken(token1.address, parseTokenUnits(100))
      await exchange.connect(user1).makeOrder(
        token2.address,
        parseTokenUnits(50),
        token1.address,
        parseTokenUnits(100),
      )
    })

    describe('success', () => {

      it('should be possible to cancel an order', async () => {
        expect(await exchange.connect(user1).canceledOrders(1)).to.not.be.ok
        await exchange.connect(user1).cancelOrder(1)
        expect(await exchange.connect(user1).canceledOrders(1)).to.be.ok
      })

      it('should emits a OrderCanceled event', async () => {
        const transaction = await exchange.connect(user1).cancelOrder(1)
        const result = await transaction.wait()

        const { events } = result
        const [orderCanceled] = events!

        expect(events?.length).to.be.eq(1)
        expect(orderCanceled.event).to.be.eq('OrderCanceled')
      })

    })

    describe('failure', () => {

      it('should reverts when user is not the order owner', async () => {
        await expect(
          exchange.connect(user2).cancelOrder(1)
        ).to.be.revertedWith('not authorized')
      })

    })

  })

})
