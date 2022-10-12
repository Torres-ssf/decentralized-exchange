import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { parseUnits } from "ethers/lib/utils"
import { ethers } from "hardhat"
import { Token } from "../typechain-types"
import { parseTokenUnits } from "./utils"

describe('Token', () => {
  const name = 'Torres Token'
  const symbol = 'TT'
  const decimals = 18
  const totalSupply = 1000000

  let token: Token
  let accounts: SignerWithAddress[]
  let deployer: SignerWithAddress
  let receiver: SignerWithAddress
  let exchange: SignerWithAddress

  beforeEach(async () => {
    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy(name, symbol, totalSupply)

    accounts = await ethers.getSigners();
    ([deployer, receiver, exchange] = accounts)
  })

  describe('Deployment', () => {

    it('should ensure token name is correct', async () => {
      expect(await token.name()).to.be.eq(name)
    })

    it('should ensure token symbol is correct', async () => {
      expect(await token.symbol()).to.be.eq(symbol)
    })

    it('should ensure token decimals is 18', async () => {
      expect(await token.decimals()).to.be.eq(decimals)
    })

    it('should ensure token totalSupply is correct', async () => {
      const parsedTotalSupply = parseTokenUnits(totalSupply)
      expect(await token.totalSupply()).to.be.eq(parsedTotalSupply)
    })

    it('should assign totalSupply to the deployer', async () => {
      const parsedTotalSupply = parseTokenUnits(totalSupply)
      expect(await token.balanceOf(deployer.address)).to.be.eq(parsedTotalSupply)
    })

  })

  describe('Sending tokens', () => {

    describe('Success', () => {

      it('should successfully tranfer tokens', async () => {

        let amount = 100

        let deployerBalance = await token.balanceOf(deployer.address)
        let receiverBalance = await token.balanceOf(receiver.address)

        expect(deployerBalance).to.be.eq(parseTokenUnits(totalSupply))
        expect(receiverBalance).to.be.eq(0)

        const transaction = await token
          .connect(deployer)
          .transfer(receiver.address, parseTokenUnits(amount))

        const result = await transaction.wait()

        deployerBalance = await token.balanceOf(deployer.address)
        receiverBalance = await token.balanceOf(receiver.address)

        expect(deployerBalance).to.be.eq(parseTokenUnits(totalSupply - amount))
        expect(receiverBalance).to.be.eq(parseTokenUnits(amount))

        expect(result).to.be.ok

      })

      it('should emit Transfer event', async () => {

        let amount = 99

        const transaction = await token
          .connect(deployer)
          .transfer(receiver.address, parseTokenUnits(amount))

        const result = await transaction.wait()

        const { events } = result

        const [triggeredEvent] = events!

        expect(events?.length).to.be.eq(1)
        expect(triggeredEvent.event).to.be.eq('Transfer')
        expect(triggeredEvent.args!.from).to.be.eq(deployer.address)
        expect(triggeredEvent.args!.to).to.be.eq(receiver.address)
        expect(triggeredEvent.args!.value).to.be.eq(parseTokenUnits(amount))
      })

    })

    describe('Failure', () => {

      it('should rejects insufficient balance', async () => {
        let invalidAmount = totalSupply + 1

        await expect(
          token
            .connect(deployer)
            .transfer(receiver.address, parseTokenUnits(invalidAmount))
        ).to.be.revertedWith('Not enough tokens to transfer')
      })

      it('should rejects for invalid receiver address', async () => {
        let amount = 10
        let invalidAddress = '0x0000000000000000000000000000000000000000'

        await expect(
          token
            .connect(deployer)
            .transfer(invalidAddress, parseTokenUnits(amount))
        ).to.be.revertedWith('Invalid receiver address')
      })

    })

  })

  describe('Approving tokens', () => {

    describe('Success', () => {

      it('should allocates an allowance for delegated token spending', async () => {
        let amount = parseTokenUnits(100)
        await token.approve(exchange.address, amount)

        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.be.eq(amount)
      })

      it('should overwrite current allowance with new value if called again', async () => {
        let firstAmount = parseTokenUnits(100)
        let larstAmount = parseTokenUnits(50)

        await token.approve(exchange.address, firstAmount)
        await token.approve(exchange.address, larstAmount)

        expect(await token.allowance(deployer.address, exchange.address)).to.be.eq(larstAmount)
      })

      it('should emit an Approval event', async () => {
        let amount = parseTokenUnits(100)
        const transaction = await token.approve(exchange.address, amount)

        const result = await transaction.wait()
        const { events } = result
        const [triggeredEvent] = events!

        expect(events?.length).to.be.eq(1)
        expect(triggeredEvent.event).to.be.eq('Approval')
        expect(triggeredEvent.args!.owner).to.be.eq(deployer.address)
        expect(triggeredEvent.args!.spender).to.be.eq(exchange.address)
        expect(triggeredEvent.args!.value).to.be.eq(amount)
      })

    })

    describe('Failure', () => {

      it('should rejects for invalid receiver address', async () => {
        let amount = parseTokenUnits(100)
        let invalidAddress = '0x0000000000000000000000000000000000000000'

        await expect(
          token.approve(invalidAddress, amount)
        ).to.be.revertedWith('Invalid spender address')
      })

    })

  })

  describe('Delegated token transfers', () => {

    describe('Success', () => {

      it('should successfully transfer tokens from one account to another', async () => {

        let amount = parseTokenUnits(100)

        const deployerBalance = await token.balanceOf(deployer.address)
        const receiverBalance = await token.balanceOf(receiver.address)

        const transaction1 = await token
          .connect(deployer)
          .approve(exchange.address, amount)

        await transaction1.wait()

        const transaction2 = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount)

        expect(await transaction2.wait()).to.be.ok

        expect(await token.balanceOf(deployer.address)).to.be.eq(deployerBalance.sub(amount))
        expect(await token.balanceOf(receiver.address)).to.be.eq(receiverBalance.add(amount))

      })

      it('should update allowance value', async () => {

        let amount = parseTokenUnits(80)
        let amountHalf = amount.div(2)

        const transaction1 = await token
          .connect(deployer)
          .approve(exchange.address, amount)

        await transaction1.wait()

        const transaction2 = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amountHalf)

        expect(await transaction2.wait()).to.be.ok
        expect(await token.allowance(deployer.address, exchange.address)).to.be.eq(amountHalf)

        const transaction3 = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amountHalf)

        expect(await transaction3.wait()).to.be.ok
        expect(await token.allowance(deployer.address, exchange.address)).to.be.eq(0)

      })

      it('should emit Transfer event', async () => {

        let amount = parseTokenUnits(100)

        const transaction1 = await token
          .connect(deployer)
          .approve(exchange.address, amount)

        await transaction1.wait()

        const transaction2 = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount)

        const result = await transaction2.wait()

        const { events } = result

        const [triggeredEvent] = events!

        expect(events?.length).to.be.eq(1)
        expect(triggeredEvent.event).to.be.eq('Transfer')
        expect(triggeredEvent.args!.from).to.be.eq(deployer.address)
        expect(triggeredEvent.args!.to).to.be.eq(receiver.address)
        expect(triggeredEvent.args!.value).to.be.eq(amount)
      })

    })

    describe('Failure', () => {

      it('should revert when no allowance exists', async () => {

        let amount = parseTokenUnits(100)

        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, amount)
        ).revertedWith('Not enough tokens allowed')

      })

      it('should revert when balance is not enought', async () => {

        let amount = parseTokenUnits(100)

        const transaction1 = await token
          .connect(receiver)
          .approve(exchange.address, amount)

        await transaction1.wait()

        await expect(
          token
            .connect(exchange)
            .transferFrom(receiver.address, deployer.address, amount)
        ).revertedWith('Not enough tokens to transfer')

      })

    })

  })

})
