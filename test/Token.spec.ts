import { expect } from "chai"
import { ethers } from "hardhat"
import { Token } from "../typechain-types"

describe('Token', () => {

  let token: Token

  before( async () => {

    const Token = await ethers.getContractFactory('Token')

    token = await Token.deploy()

  })

  it('should ensure token name is correct', async () => {
    expect(await token.name()).to.be.eq('Torres Token')
  })

  it('should ensure token symbol is correct', async () => {
    expect(await token.symbol()).to.be.eq('TT')
  })

  it('should ensure token decimals is 18', async () => {
    expect(await token.decimals()).to.be.eq(18)
  })

  it('should ensure token totalSupply is times 10^24', async () => {
    const value = ethers.utils.parseUnits('1000000')
    expect(await token.totalSupply()).to.be.eq(value)
  })
})
