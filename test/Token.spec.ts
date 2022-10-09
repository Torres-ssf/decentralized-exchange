import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { parseUnits } from "ethers/lib/utils"
import { ethers } from "hardhat"
import { Token } from "../typechain-types"

describe('Token', () => {

  let token: Token
  let accounts: SignerWithAddress[]
  let deployer: SignerWithAddress
  let receiver: SignerWithAddress

  const name = 'Torres Token'
  const symbol = 'TT'
  const decimals = 18
  const totalSupply = 1000000

  beforeEach(async () => {

    const Token = await ethers.getContractFactory('Token')

    token = await Token.deploy(name, symbol, totalSupply)

    accounts = await ethers.getSigners();

    ([deployer, receiver] = accounts)

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

      it('should trigger Transfer event', async () => {

        let amount = 99

        const transaction = await token
          .connect(deployer)
          .transfer(receiver.address, parseTokenUnits(amount))

        const result = await transaction.wait()

        const { events } = result

        const [triggeredEvent] = events!

        expect(events?.length).to.be.eq(1)
        expect(triggeredEvent?.event).to.be.eq('Transfer')
        expect(triggeredEvent?.args!.from).to.be.eq(deployer.address)
        expect(triggeredEvent?.args!.to).to.be.eq(receiver.address)
        expect(triggeredEvent?.args!.value).to.be.eq(parseTokenUnits(amount))

      })

    })

    describe('Failure', () => {

      it('should rejects insufficient balance', async () => {
        let invalidAmount = totalSupply + 1

        await expect(
          token
            .connect(deployer)
            .transfer(receiver.address, parseTokenUnits(invalidAmount))
        ).to.be.revertedWith('Not enough tokens')
      })

      it('should rejects if amount is equal to 0', async () => {
        let invalidAmount = 0

        await expect(
          token
            .connect(deployer)
            .transfer(receiver.address, parseTokenUnits(invalidAmount))
        ).to.be.revertedWith('Transfer amount must be greater than zero')
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

  const parseTokenUnits = (amount: number) => {
    return parseUnits(String(amount))
  }

})
