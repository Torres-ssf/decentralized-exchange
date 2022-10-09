import { expect } from "chai"
import { ethers } from "hardhat"
import { Token } from "../typechain-types"

describe('Token', () => {

  describe('Deployment', () => {

    let token: Token

    const name = 'Torres Token'
    const symbol = 'TT'
    const decimals = 18
    const totalSupply = 1000000

    before( async () => {

      const Token = await ethers.getContractFactory('Token')

      token = await Token.deploy(name, symbol, totalSupply)

    })

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
      const parsedUnits = ethers.utils.parseUnits(String(totalSupply), decimals)
      expect(await token.totalSupply()).to.be.eq(parsedUnits)
    })

  })


})
