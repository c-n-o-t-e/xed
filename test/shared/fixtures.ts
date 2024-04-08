import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { MockTimeUniswapV3Pool } from '../../typechain/MockTimeUniswapV3Pool'
import { TestERC20 } from '../../typechain/TestERC20'

import { UniswapV3Factory } from '../../typechain/UniswapV3Factory'
import { TestUniswapV3Callee } from '../../typechain/TestUniswapV3Callee'
import { TestUniswapV3Router } from '../../typechain/TestUniswapV3Router'
import { MockTimeUniswapV3PoolDeployer } from '../../typechain/MockTimeUniswapV3PoolDeployer'
import {
  PearlV2Pool,
  PearlV2Factory,
  // SwapRouter,
  // NFTDescriptor,
  // NonfungibleTokenPositionDescriptor,
  // NonfungiblePositionManager,
  Bytecode,
  IWETH9,
} from '../../typechain'
import { asciiStringToBytes32 } from '../../scripts/utils/asciiStringToBytes32'

import WETH9 from '../contracts/WETH9.json'

import { Fixture } from 'ethereum-waffle'

interface FactoryFixture {
  factory: UniswapV3Factory
}

async function factoryFixture(): Promise<FactoryFixture> {
  const factoryFactory = await ethers.getContractFactory('UniswapV3Factory')
  const factory = (await factoryFactory.deploy()) as UniswapV3Factory
  return { factory }
}

const wethFixture: Fixture<{ weth9: IWETH9 }> = async ([wallet]) => {
  const weth9 = (await waffle.deployContract(wallet, {
    bytecode: WETH9.bytecode,
    abi: WETH9.abi,
  })) as IWETH9

  return { weth9 }
}

interface TokensFixture {
  token0: TestERC20
  token1: TestERC20
  token2: TestERC20
}

async function tokensFixture(): Promise<TokensFixture> {
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokenA = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenB = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenC = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20

  const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
  )

  return { token0, token1, token2 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
  swapTargetCallee: TestUniswapV3Callee
  swapTargetRouter: TestUniswapV3Router
  createPool(
    fee: number,
    tickSpacing: number,
    firstToken?: TestERC20,
    secondToken?: TestERC20
  ): Promise<MockTimeUniswapV3Pool>
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (): Promise<PoolFixture> {
  const { factory } = await factoryFixture()
  const { token0, token1, token2 } = await tokensFixture()

  const MockTimeUniswapV3PoolDeployerFactory = await ethers.getContractFactory('MockTimeUniswapV3PoolDeployer')
  const MockTimeUniswapV3PoolFactory = await ethers.getContractFactory('MockTimeUniswapV3Pool')

  const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee')
  const routerContractFactory = await ethers.getContractFactory('TestUniswapV3Router')

  const swapTargetCallee = (await calleeContractFactory.deploy()) as TestUniswapV3Callee
  const swapTargetRouter = (await routerContractFactory.deploy()) as TestUniswapV3Router

  return {
    token0,
    token1,
    token2,
    factory,
    swapTargetCallee,
    swapTargetRouter,
    createPool: async (fee, tickSpacing, firstToken = token0, secondToken = token1) => {
      const mockTimePoolDeployer =
        (await MockTimeUniswapV3PoolDeployerFactory.deploy()) as MockTimeUniswapV3PoolDeployer
      const tx = await mockTimePoolDeployer.deploy(
        factory.address,
        firstToken.address,
        secondToken.address,
        fee,
        tickSpacing
      )

      const receipt = await tx.wait()
      const poolAddress = receipt.events?.[0].args?.pool as string
      return MockTimeUniswapV3PoolFactory.attach(poolAddress) as MockTimeUniswapV3Pool
    },
  }
}

interface PearlV2Fixture extends TokensFixture {
  factory: PearlV2Factory
  pool: PearlV2Pool
  // router: SwapRouter
  // nftManager: NonfungiblePositionManager
  byteHash: Bytecode
}

export const pearlV2Fixture: Fixture<PearlV2Fixture> = async function ([wallet], provider): Promise<PearlV2Fixture> {
  const { token0, token1, token2 } = await tokensFixture()
  // const { weth9 } = await wethFixture([wallet], provider)

  const poolFactory = await ethers.getContractFactory('PearlV2Pool')
  const pool = (await poolFactory.deploy()) as PearlV2Pool

  const factoryFactory = await ethers.getContractFactory('PearlV2Factory')
  const factory = (await factoryFactory.deploy(wallet.address, pool.address)) as PearlV2Factory

  // const routerFactory = await ethers.getContractFactory('SwapRouter')
  // const router = (await routerFactory.deploy(factory.address, weth9.address)) as SwapRouter

  // //NFT
  // const nftDescriptorFactory = await ethers.getContractFactory('NFTDescriptor')
  // const nftLib = (await nftDescriptorFactory.deploy()) as NFTDescriptor

  // const descriptoFactory = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
  //   libraries: { NFTDescriptor: nftLib.address },
  // })
  // const descriptor = (await descriptoFactory.deploy(
  //   weth9.address,
  //   asciiStringToBytes32('MATIC')
  // )) as NonfungibleTokenPositionDescriptor

  // const positionManagerFactory = await ethers.getContractFactory('NonfungiblePositionManager')
  // const nftManager = (await positionManagerFactory.deploy(
  //   factory.address,
  //   weth9.address,
  //   descriptor.address
  // )) as NonfungiblePositionManager

  const BytecodeFactory = await ethers.getContractFactory('Bytecode')
  const byteHash = (await BytecodeFactory.deploy()) as Bytecode

  return { token0, token1, token2, factory, pool, byteHash }
}
