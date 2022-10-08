import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'

const config: HardhatUserConfig = {
  solidity: '0.8.9',
  networks: {
    localhost: {},
  }
}

export default config
