import { BTCChain } from '@xchainjs/xchain-bitcoin'
import { BCHChain } from '@xchainjs/xchain-bitcoincash'
import { BSCChain } from '@xchainjs/xchain-bsc'
import { Balance, Network } from '@xchainjs/xchain-client'
import { GAIAChain } from '@xchainjs/xchain-cosmos'
import { DOGEChain } from '@xchainjs/xchain-doge'
import { ETHChain } from '@xchainjs/xchain-ethereum'
import { LTCChain } from '@xchainjs/xchain-litecoin'
import { PoolDetail } from '@xchainjs/xchain-midgard'
import { assetAmount, assetToBase, assetToString, baseAmount } from '@xchainjs/xchain-util'
import { Chain } from '@xchainjs/xchain-util'
import * as FP from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'

import { PoolsWatchList } from '../../shared/api/io'
import { ASSETS_MAINNET } from '../../shared/mock/assets'
import { AssetRuneNative, AssetBSC } from '../../shared/utils/asset'
import { AssetUSDTBSC } from '../const'
import { GetPoolsStatusEnum, PoolDetails } from '../services/midgard/types'
import { toPoolData } from '../services/midgard/utils'
import { DEFAULT_MIMIR_HALT } from '../services/thorchain/const'
import { PoolData, PricePool } from '../views/pools/Pools.types'
import {
  disableAllActions,
  disablePoolActions,
  disableTradingActions,
  getDeepestPool,
  getPoolPriceValue,
  getPoolTableRowsData
} from './poolHelper'

describe('helpers/poolHelper/', () => {
  const mockPoolDetail: PoolDetail = {
    asset: assetToString(AssetBSC),
    assetDepth: '0',
    assetPrice: '0',
    assetPriceUSD: '0',
    poolAPY: '0',
    runeDepth: '0',
    status: GetPoolsStatusEnum.Staged,
    units: '0',
    volume24h: '0',
    liquidityUnits: '0',
    synthUnits: '0',
    synthSupply: '0',
    annualPercentageRate: '0',
    nativeDecimal: '0',
    saversDepth: '0',
    saversUnits: '0',
    saversAPR: '0',
    totalCollateral: '0',
    totalDebtTor: '0',
    earnings: '0',
    earningsAnnualAsPercentOfDepth: '0',
    lpLuvi: '0'
  }
  const pool1: PoolDetail = { ...mockPoolDetail, status: GetPoolsStatusEnum.Staged, runeDepth: '1000' }
  const pool2: PoolDetail = { ...mockPoolDetail, status: GetPoolsStatusEnum.Available, runeDepth: '2000' }
  const pool3: PoolDetail = { ...mockPoolDetail, status: GetPoolsStatusEnum.Suspended, runeDepth: '0' }
  const pool4: PoolDetail = { ...mockPoolDetail, status: GetPoolsStatusEnum.Staged, runeDepth: '4000' }

  const watchlist: PoolsWatchList = [AssetBSC]

  describe('getDeepestPool', () => {
    it('returns deepest pool', () => {
      const pools = [pool1, pool2, pool4, pool3]
      const result = getDeepestPool(pools)
      expect(result).toEqual(O.some(pool4))
    })

    it('does not return a deepest pool by given an empty list of pools', () => {
      const pools: PoolDetails = []
      const result = getDeepestPool(pools)
      expect(result).toBeNone()
    })
  })

  describe('getPoolTableRowsData', () => {
    const poolDetails: PoolDetails = [
      { ...mockPoolDetail, asset: assetToString(ASSETS_MAINNET.ETH), status: GetPoolsStatusEnum.Available },
      { ...mockPoolDetail, asset: assetToString(ASSETS_MAINNET.BTC), status: GetPoolsStatusEnum.Available }
    ]
    const pendingPoolDetails: PoolDetails = [
      { ...mockPoolDetail, asset: assetToString(ASSETS_MAINNET.DOGE), status: GetPoolsStatusEnum.Staged },
      { ...mockPoolDetail, asset: assetToString(ASSETS_MAINNET.BTC), status: GetPoolsStatusEnum.Staged }
    ]

    const pricePoolData: PoolData = {
      dexBalance: assetToBase(assetAmount(110)),
      assetBalance: assetToBase(assetAmount(100))
    }

    it('returns data for pending pools', () => {
      const result = getPoolTableRowsData({
        poolDetails: pendingPoolDetails,
        pricePoolData,
        watchlist,
        network: Network.Testnet
      })
      expect(result.length).toEqual(2)
      // Note: `getPoolTableRowsData` reverses the order of given `poolDetails`
      expect(result[0].asset).toEqual(ASSETS_MAINNET.BTC)
      expect(result[1].asset).toEqual(ASSETS_MAINNET.DOGE)
    })

    it('returns data for available pools', () => {
      const result = getPoolTableRowsData({
        poolDetails,
        pricePoolData,
        watchlist,
        network: Network.Testnet
      })
      expect(result.length).toEqual(2)
      // Note: `getPoolTableRowsData` reverses the order of given `poolDetails`
      expect(result[0].asset).toEqual(ASSETS_MAINNET.BTC)
      expect(result[1].asset).toEqual(ASSETS_MAINNET.ETH)
    })
  })

  describe('toPoolData', () => {
    const poolDetail: PoolDetail = {
      ...mockPoolDetail,
      assetDepth: '11000000000',
      runeDepth: '10000000000'
    }

    it('transforms `PoolData', () => {
      const result = toPoolData(poolDetail)
      expect(result.assetBalance.amount().toNumber()).toEqual(11000000000)
      expect(result.dexBalance.amount().toNumber()).toEqual(10000000000)
    })
  })

  describe('getPoolPriceValue', () => {
    const poolDetails: PoolDetails = [
      {
        ...mockPoolDetail,
        asset: assetToString(AssetBSC),
        assetDepth: '1000000000',
        runeDepth: '10000000000'
      }
    ]

    const usdPricePool: PricePool = {
      asset: AssetUSDTBSC,
      poolData: {
        assetBalance: assetToBase(assetAmount(110000)),
        dexBalance: assetToBase(assetAmount(100000))
      }
    }

    it('returns a price for BSC in USD', () => {
      const balance: Balance = {
        amount: baseAmount('1'),
        asset: AssetBSC
      }
      const result = FP.pipe(
        getPoolPriceValue({ balance, poolDetails, pricePool: usdPricePool }),
        O.fold(
          () => 'failure',
          (price) => price.amount().toString()
        )
      )
      expect(result).toEqual('11')
    })

    it('returns a price for RUNE in USD', () => {
      const balance: Balance = {
        amount: baseAmount('1'),
        asset: AssetRuneNative
      }
      const result = FP.pipe(
        getPoolPriceValue({ balance, poolDetails: [], pricePool: usdPricePool }),
        O.fold(
          () => 'failure',
          (price) => price.amount().toString()
        )
      )
      expect(result).toEqual('1')
    })

    it('returns a no price if no pools are available', () => {
      const balance: Balance = {
        amount: baseAmount('1'),
        asset: AssetBSC
      }
      const result = getPoolPriceValue({ balance, poolDetails: [], pricePool: usdPricePool })
      expect(result).toBeNone()
    })
  })

  describe('disableAllActions', () => {
    const haltedChains: Chain[] = [ETHChain, BSCChain]
    it('true for any chain if THORChain is halted', () => {
      const result = disableAllActions({
        chain: BSCChain,
        haltedChains,
        mimirHalt: { ...DEFAULT_MIMIR_HALT, haltTHORChain: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if chain is not in halted list, but THORChain is halted', () => {
      const result = disableAllActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: { ...DEFAULT_MIMIR_HALT, haltTHORChain: true }
      })
      expect(result).toBeTruthy()
    })
    it('true for ETH if ETH chain is halted', () => {
      const result = disableAllActions({
        chain: ETHChain,
        haltedChains,
        mimirHalt: { ...DEFAULT_MIMIR_HALT, haltETHChain: true }
      })
      expect(result).toBeTruthy()
    })
    it('false for a chain, if it is not in halted list, but ETH chain is halted', () => {
      const result = disableAllActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: { ...DEFAULT_MIMIR_HALT, haltETHChain: true }
      })
      expect(result).toBeFalsy()
    })
    it('true if ETH is in halted list, but no mimir halt', () => {
      const result = disableAllActions({
        chain: ETHChain,
        haltedChains,
        mimirHalt: DEFAULT_MIMIR_HALT
      })
      expect(result).toBeTruthy()
    })
    it('true if BSC is in halted list, but no mimir halt', () => {
      const result = disableAllActions({
        chain: BSCChain,
        haltedChains,
        mimirHalt: DEFAULT_MIMIR_HALT
      })
      expect(result).toBeTruthy()
    })
    it('false if no mimir halt + chain is not in halted list', () => {
      const result = disableAllActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: DEFAULT_MIMIR_HALT
      })
      expect(result).toBeFalsy()
    })
  })

  describe('disableTradingActions', () => {
    const haltedChains: Chain[] = [ETHChain, BSCChain]
    it('true for any chain if trading is halted', () => {
      const result = disableTradingActions({
        chain: BSCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltTrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('true if chain is not in halted list, but trading is halted', () => {
      const result = disableTradingActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltTrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('true for BTC if BTC trading is halted', () => {
      const result = disableTradingActions({
        chain: BTCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltBTCTrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('true for ETH if ETH trading is halted', () => {
      const result = disableTradingActions({
        chain: ETHChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltETHTrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('true for BCH if BCH trading is halted', () => {
      const result = disableTradingActions({
        chain: BCHChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltBCHTrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('true for LTC if LTC trading is halted', () => {
      const result = disableTradingActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltLTCTrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('true for DOGE if DOGE trading is halted', () => {
      const result = disableTradingActions({
        chain: DOGEChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltDOGETrading: true
        }
      })
      expect(result).toBeTruthy()
    })

    it('true for BSC if BSC trading is halted', () => {
      const result = disableTradingActions({
        chain: BSCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltBSCTrading: true
        }
      })
      expect(result).toBeTruthy()
    })

    it('true for Cosmos if Cosmos trading is halted', () => {
      const result = disableTradingActions({
        chain: GAIAChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltGAIATrading: true
        }
      })
      expect(result).toBeTruthy()
    })
    it('false for a chain, if it is not in halted list, but other chains have trading halted', () => {
      const result = disableTradingActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltBTCTrading: true,
          haltETHTrading: true,
          haltBCHTrading: true,
          haltBSCTrading: true,
          haltGAIATrading: true
        }
      })
      expect(result).toBeFalsy()
    })
    it('true if ETH is in halted list, but no mimir trading halt', () => {
      const result = disableTradingActions({
        chain: ETHChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT
        }
      })
      expect(result).toBeTruthy()
    })
    it('true if BSC is in halted list, but no mimir trading halt', () => {
      const result = disableTradingActions({
        chain: BSCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT
        }
      })
      expect(result).toBeTruthy()
    })
    it('false if no mimir trading halt + chain is not in halted list', () => {
      const result = disableTradingActions({
        chain: LTCChain,
        haltedChains,
        mimirHalt: {
          ...DEFAULT_MIMIR_HALT,
          haltETHTrading: true
        }
      })
      expect(result).toBeFalsy()
    })
  })

  describe('disablePoolActions', () => {
    it('true if trading is halted for this chain', () => {
      const result = disablePoolActions({
        chain: BTCChain,
        haltedChains: [ETHChain, BTCChain],
        mimirHalt: { ...DEFAULT_MIMIR_HALT }
      })
      expect(result).toBeTruthy()
    })

    it('true if LP is paused', () => {
      const result = disablePoolActions({
        chain: BTCChain,
        haltedChains: [ETHChain, BTCChain],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if BTC chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: BTCChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpBTC: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if BTC chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: BTCChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if BTC chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: BTCChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpBTC: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if BTC chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: BTCChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if BCH chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: BCHChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpBCH: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if BCH chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: BCHChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if ETH chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: ETHChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpETH: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if ETH chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: ETHChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if LTC chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: LTCChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpLTC: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if LTC chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: LTCChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if DOGE chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: DOGEChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpDOGE: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if DOGE chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: DOGEChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if Cosmos chain is not in halted list, but paused', () => {
      const result = disablePoolActions({
        chain: GAIAChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLpGAIA: true }
      })
      expect(result).toBeTruthy()
    })
    it('true if Cosmos chain is not in halted list, but LP paused', () => {
      const result = disablePoolActions({
        chain: GAIAChain,
        haltedChains: [],
        mimirHalt: { ...DEFAULT_MIMIR_HALT, pauseLp: true }
      })
      expect(result).toBeTruthy()
    })
  })
})
