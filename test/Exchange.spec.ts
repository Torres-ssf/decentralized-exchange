import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

describe('Exchange', () => {

  let accounts: SignerWithAddress[]
  let exchange: Contract
  let deploy: SignerWithAddress
  let feeAccount: SignerWithAddress
  let feePercent: number

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deploy = accounts[0]
    feeAccount = accounts[1]
    feePercent = 10

    const Exchange = await ethers.getContractFactory('Exchange')
    exchange = await Exchange.deploy(feeAccount.address, feePercent)
  })

  describe('Deployment', () => {

    it('should tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.be.eq(feeAccount.address)
    })

    it('should tracks the fee percent value', async () => {
      expect(await exchange.feePercent()).to.be.eq(feePercent)
    })

  })

})
