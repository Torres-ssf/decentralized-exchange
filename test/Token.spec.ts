import { expect } from "chai"
import { ethers } from "hardhat"

describe('Token', () => {

  it('has a name', async () => {

    const Token = await ethers.getContractFactory('Token')

    const token = await Token.deploy()

    const name = await token.name()

    expect(name).to.be.eq('Token 1')

  })

})
