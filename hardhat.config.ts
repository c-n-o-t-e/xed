import 'hardhat-typechain'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-contract-sizer'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/.env' })

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    mumbai: {
      chainId: 80001,
      url: `https://${process.env.MUMBAI_RPC_URL}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
      gasPrice: 20e9,
      gas: 25e6,
    },
    sepolia: {
      chainId: 11155111,
      url: `${process.env.SEPOLIA_RPC_URL}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
    },
    unreal: {
      chainId: 18233,
      url: `${process.env.UNREAL_RPC_URL}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
      gasPrice: 20e9,
      gas: 25e6,
    },
    arbitrumSepolia: {
      url: `https://${process.env.ARBITRUM_SEPOLIA_RPC_URL}`,
      chainId: 421614,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
    },
    holesky: {
      url: `https://${process.env.HOLESKY_RPC_URL}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    // apiKey: process.env.ETHERSCAN_API_KEY,
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumSepolia: process.env.ARBISCAN_API_KEY,
      holesky: process.env.ETHERSCAN_API_KEY,
      unreal: 'abc',
    },
    customChains: [
      {
        network: 'unreal',
        chainId: 18233,
        urls: {
          apiURL: process.env.UNREAL_API_URL,
          browserURL: process.env.UNREAL_BROWSER_URL,
        },
      },
      {
        network: 'arbitrumSepolia',
        chainId: 421614,
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io/',
        },
      },
      {
        network: 'holesky',
        chainId: 17000,
        urls: {
          apiURL: 'https://api-holesky.etherscan.io/api',
          browserURL: 'https://holesky.etherscan.io/',
        },
      },
    ],
  },
  solidity: {
    version: '0.7.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: 'none',
      },
    },
  },
}
