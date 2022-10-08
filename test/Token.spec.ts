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

    const name = await token.name()

    expect(name).to.be.eq('Torres Token')

  })

  it('should ensure token symbol is correct', async () => {

    const symbol = await token.symbol()

    expect(symbol).to.be.eq('TT')

  })

})
