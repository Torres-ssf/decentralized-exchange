import { ethers } from 'hardhat'

async function main(): Promise<void> {

  const accounts = await ethers.getSigners()

  const Token = await ethers.getContractFactory('Token')
  const Exchange = await ethers.getContractFactory('Exchange')

  const mUSDT = await Token.deploy('Moked USDT', 'mUSDT', '1000000')
  await mUSDT.deployed()
  console.info('Deployed mUSDT to: ', mUSDT.address)

  const mWBTC = await Token.deploy('Mocked Wrapped BTC', 'mWBTC', '1000000')
  await mWBTC.deployed()
  console.info('Deployed mWBTC to: ', mWBTC.address)

  const exchange = await Exchange.deploy(accounts[1].address, 1)
  await exchange.deployed()
  console.info('Deployed Exchange to: ', exchange.address)
}


main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
