import { ethers } from 'hardhat'

async function main(): Promise<void> {

  const Token = await ethers.getContractFactory('Token')

  const token = await Token.deploy()

  await token.deployed()

  console.log(`Token address is: ${token.address}`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
