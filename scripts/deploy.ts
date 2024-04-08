import fs from 'fs'
import hre from 'hardhat'

import { deploy } from './utils/deployment-create3'

import { asciiStringToBytes32 } from './utils/asciiStringToBytes32'
import {} from '../typechain'

const { ethers, network } = hre

const addresses = fs.existsSync(`addresses.${network.name}.json`)
  ? JSON.parse(fs.readFileSync(`addresses.${network.name}.json`, 'utf-8'))
  : {}

async function main() {
  let WETH9

  const [signer, user0] = await ethers.getSigners()

  console.log('Deploying Contracts...')

  const latest = await signer.getTransactionCount('latest')
  const pending = await signer.getTransactionCount('pending')

  console.log(latest)
  console.log(pending)

  if (latest < pending) {
    await signer.sendTransaction({
      to: ethers.constants.AddressZero,
      value: 0,
      nonce: latest,
    })
    process.exit(0)
  }

  if (['hardhat', 'localhost'].includes(network.name)) {
    // await network.provider.send('evm_setIntervalMining', [3000])
    // fs.writeFileSync(`addresses.${network.name}.json`, '{}', 'utf-8')
    // WETH9 = deploy('ERC20', ['Wrapped ETH', 'WETH']).then((c) => c.address)
  } else if (network.name === 'mumbai') {
    WETH9 = addresses.WETH9
  } else if (network.name === 'unreal') {
    WETH9 = addresses.WETH9
  } else {
    WETH9 = addresses.WETH9
  }

  // ############# CORE ####################

  //deploy bytecode to get the INITHASH
  // await deploy('Bytecode')

  const initialOwner = signer.address

  // const poolLibraryAddress = await deploy('PearlV2Pool').then((contract) => contract.address)

  const SqrtPriceMathV2Lib = await deploy('SqrtPriceMathV2').then((contract) => contract.address)
  const LiquidityAmountsV2Lib = await deploy('LiquidityAmountsV2').then((contract) => contract.address)
  const SwapMathV2Lib = await deploy('SwapMathV2', [], []).then((contract) => contract.address)
  const poolLibraryAddress = await deploy('PearlV2Pool', [], [], {
    libraries: {
      SqrtPriceMathV2: SqrtPriceMathV2Lib,
      LiquidityAmountsV2: LiquidityAmountsV2Lib,
      SwapMathV2: SwapMathV2Lib,
    },
  }).then((contract) => contract.address)
  const pairFactory = await deploy('PearlV2Factory', [initialOwner, poolLibraryAddress])
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
