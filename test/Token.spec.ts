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

    it('should successfully tranfer tokens', async () => {

      let amount = 100

      let deployerBalance = await token.balanceOf(deployer.address)
      let receiverBalance = await token.balanceOf(receiver.address)

      expect(deployerBalance).to.be.eq(parseTokenUnits(totalSupply))
      expect(receiverBalance).to.be.eq(0)

      const transaction = await token
        .connect(deployer)
        .transfer(receiver.address, parseTokenUnits(amount))

      await transaction.wait()

      deployerBalance = await token.balanceOf(deployer.address)
      receiverBalance = await token.balanceOf(receiver.address)

      expect(deployerBalance).to.be.eq(parseTokenUnits(totalSupply - amount))
      expect(receiverBalance).to.be.eq(parseTokenUnits(amount))

    })

  })

  const parseTokenUnits = (amount: number) => {
    return parseUnits(String(amount))
  }

})
