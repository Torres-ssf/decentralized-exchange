import { expect } from "chai"
import { ethers } from "hardhat"

describe('Token', () => {

  it('should ensure name is correct', async () => {

    const Token = await ethers.getContractFactory('Token')

    const token = await Token.deploy()

    const name = await token.name()

    expect(name).to.be.eq('Torres Token')

  })

})
