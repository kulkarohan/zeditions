import * as dotenv from 'dotenv'
import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-solhint'
import 'hardhat-typechain'

dotenv.config()
const INFURA_API_KEY: string = process.env.INFURA_API_KEY ?? ''
const RINKEBY_DEPLOY_PK: string = process.env.RINKEBY_DEPLOY_PK ?? ''

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.7',
        settings: {
            optimizer: {
                enabled: true,
                runs: 2000
            }
        }
    },
    typechain: {
        outDir: 'typechain',
        target: 'ethers-v5'
    },
    networks: {
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [`0x${RINKEBY_DEPLOY_PK}`]
        }
    }
}

export default config
