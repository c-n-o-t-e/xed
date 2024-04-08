import chai from 'chai'
import { expect } from 'chai'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ethers, waffle } from 'hardhat'
import { BigNumber, BigNumberish, Wallet, Signer } from 'ethers'

import { pearlV2Fixture } from './shared/fixtures'
import { TestERC20 } from '../typechain/TestERC20'
import {
  PearlV2Factory,
  PearlV2Pool,
  Bytecode,
  // SwapRouter,
  // NonfungiblePositionManager,
  IPearlV2Pool,
} from '../typechain'

import { MaxUint128, encodePriceSqrt, FeeAmount, getMinTick, getMaxTick, TICK_SPACINGS } from './shared/utilities'

import { solidity } from 'ethereum-waffle'
chai.use(solidity)

const createFixtureLoader = waffle.createFixtureLoader

describe('Integration', () => {
  let wallet: Wallet, other: Wallet, alice: Wallet, bob: Wallet, carol: Wallet

  let token0: TestERC20
  let token1: TestERC20
  let token2: TestERC20
  let factory: PearlV2Factory
  let pool: PearlV2Pool
  // let router: SwapRouter
  // let nftManager: NonfungiblePositionManager
  let byteHash: Bytecode
  let pearlPool: IPearlV2Pool

  const fee = FeeAmount.MEDIUM
  let loadFixture: ReturnType<typeof createFixtureLoader>

  before('create fixture loader', async () => {
    ;[wallet, other, alice, bob, carol] = await (ethers as any).getSigners()
    loadFixture = createFixtureLoader([wallet, other])
  })

  beforeEach('deploy contracts', async () => {
    ;({ token0, token1, token2, factory, pool, byteHash } = await loadFixture(pearlV2Fixture))
    //create new pool
    await factory.createPool(token0.address, token1.address, fee)
    const poolAddress = await factory.getPool(token0.address, token1.address, fee)
    pearlPool = (await ethers.getContractAt('IPearlV2Pool', poolAddress)) as IPearlV2Pool
    await factory.initializePoolPrice(pearlPool.address, encodePriceSqrt(parseETH('0.7'), parseETH('1')))
    await transfer(alice, '1000')
    await transfer(bob, '1000')
    await transfer(carol, '1000')
  })

  function parseETH(amount: string) {
    return ethers.utils.parseEther(amount)
  }

  async function transfer(user: Signer, amount: string) {
    await token0.transfer(await user.getAddress(), parseETH(amount))
    await token1.transfer(await user.getAddress(), parseETH(amount))
    // await approve(user, amount)
  }

  async function approve(user: Signer, amount: string) {
    await token0.connect(user).approve(pearlPool.address, parseETH(amount))
    await token1.connect(user).approve(pearlPool.address, parseETH(amount))
  }

  it('Pool Address Compute', async () => {
    const computePoolAddress = await byteHash.computePoolAddress(
      '0x6254c71Eae8476BE8fd0B9F14AEB61d578422991',
      '0x665D4921fe931C0eA1390Ca4e0C422ba34d26169',
      '0xabAa4C39cf3dF55480292BBDd471E88de8Cc3C97',
      1000
    )
    console.log(computePoolAddress)
  })

  it('Pool Address Compute', async () => {
    const compute2 = await byteHash.compute(
      '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      '0xB2BFA92bc75e2c93acCacF0E9918a02936BA8617',
      token0.address,
      token1.address,
      fee
    )

    console.log(compute2.bytecodeHash)

    const computePoolAddress = await byteHash.computePoolAddress(factory.address, token0.address, token1.address, fee)
    const compute = await byteHash.compute(factory.address, pool.address, token0.address, token1.address, fee)
    expect(compute.bytecodeHash).to.eq('0x5ba51c252e11073dc0f868e7ece55e6d0dd358baa18eae1b8ed0637a081ea155')
    expect(pearlPool.address).to.eq(computePoolAddress)
    console.log('Pool deployed at', pearlPool.address)
    //localhost hash: 0xd7862af7a62fd5ba07fa2439e5dd8d59e68cb6f850940bd873b22989360f735f
  })
})
