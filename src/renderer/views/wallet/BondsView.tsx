import React, { useCallback, useEffect, useMemo, useState } from 'react'

import * as RD from '@devexperts/remote-data-ts'
import { Network } from '@xchainjs/xchain-client'
import { AssetCacao, MAYAChain } from '@xchainjs/xchain-mayachain'
import { Client as MayachainClient } from '@xchainjs/xchain-mayachain'
import { Client as ThorchainClient, THORChain, AssetRuneNative } from '@xchainjs/xchain-thorchain'
import { Address } from '@xchainjs/xchain-util'
import { Row } from 'antd'
import * as FP from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { useObservableState } from 'observable-hooks'
import { useNavigate } from 'react-router-dom'

import { Bonds } from '../../components/Bonds'
import { RefreshButton } from '../../components/uielements/button'
import { AssetsNav } from '../../components/wallet/assets'
import { useAppContext } from '../../contexts/AppContext'
import { useMayachainContext } from '../../contexts/MayachainContext'
import { useThorchainContext } from '../../contexts/ThorchainContext'
import { useUserNodesContext } from '../../contexts/UserNodesContext'
import { useWalletContext } from '../../contexts/WalletContext'
import { filterWalletBalancesByAssets } from '../../helpers/walletHelper'
import { useNodeInfos } from '../../hooks/useNodeInfos'
import { useValidateAddress } from '../../hooks/useValidateAddress'
import * as walletRoutes from '../../routes/wallet'
import { DEFAULT_NETWORK } from '../../services/const'
import { balancesState$ } from '../../services/wallet'
import { DEFAULT_BALANCES_FILTER, INITIAL_BALANCES_STATE } from '../../services/wallet/const'
import { WalletBalances } from '../../services/wallet/types'

export type WalletAddressInfo = {
  address: string
  walletType: string
}

export const BondsView: React.FC = (): JSX.Element => {
  const { client$, getNodeInfos$, reloadNodeInfos: reloadNodeInfosThor } = useThorchainContext()
  const {
    client$: clientMaya$,
    getNodeInfos$: getNodeInfosMaya$,
    reloadNodeInfos: reloadNodeInfosMaya
  } = useMayachainContext()
  const { userNodes$, addNodeAddress, removeNodeByAddress: removeNodeByAddressService } = useUserNodesContext()
  const { network$ } = useAppContext()
  const navigate = useNavigate()
  const { setSelectedAsset } = useWalletContext()
  const network = useObservableState<Network>(network$, DEFAULT_NETWORK)
  const oClientThor = useObservableState<O.Option<ThorchainClient>>(client$, O.none)
  const oClientMaya = useObservableState<O.Option<MayachainClient>>(clientMaya$, O.none)
  const [balancesState] = useObservableState(
    () =>
      balancesState$({
        ...DEFAULT_BALANCES_FILTER
      }),
    INITIAL_BALANCES_STATE
  )
  const { balances: oWalletBalances } = balancesState
  const allBalances: WalletBalances = useMemo(() => {
    return FP.pipe(
      oWalletBalances,
      O.map((balances) => filterWalletBalancesByAssets(balances, [AssetRuneNative, AssetCacao])),
      O.getOrElse<WalletBalances>(() => [])
    )
  }, [oWalletBalances])

  const { validateAddress: validateAddressThor } = useValidateAddress(THORChain)
  const { validateAddress: validateAddressMaya } = useValidateAddress(MAYAChain)

  // State to track fetched wallet addresses
  const [walletAddresses, setWalletAddresses] = useState<Record<'THOR' | 'MAYA', WalletAddressInfo[]>>({
    THOR: [],
    MAYA: []
  })

  // State to track if wallet addresses have been fetched
  const [addressesFetched, setAddressesFetched] = useState(false)

  const reloadNodeInfos = useCallback(() => {
    reloadNodeInfosThor()
    reloadNodeInfosMaya()
  }, [reloadNodeInfosThor, reloadNodeInfosMaya])

  const goToExplorerNodeAddress = useCallback(
    (address: Address) =>
      address.startsWith('thor')
        ? FP.pipe(
            oClientThor,
            O.map((client) => client.getExplorerAddressUrl(address)),
            O.map(window.apiUrl.openExternal)
          )
        : FP.pipe(
            oClientMaya,
            O.map((client) => client.getExplorerAddressUrl(address)),
            O.map(window.apiUrl.openExternal)
          ),
    [oClientThor, oClientMaya]
  )

  // Effect to fetch wallet addresses first
  useEffect(() => {
    const addressesByChain: Record<'THOR' | 'MAYA', WalletAddressInfo[]> = {
      THOR: [],
      MAYA: []
    }

    if (allBalances.length > 0) {
      allBalances.forEach(({ asset, walletAddress, walletType }) => {
        if (asset.chain === 'THOR' || asset.chain === 'MAYA') {
          addressesByChain[asset.chain].push({ address: walletAddress, walletType })
        }
      })

      setWalletAddresses(addressesByChain)
      setAddressesFetched(true)
    } else {
      setAddressesFetched(true)
    }
  }, [allBalances, addNodeAddress, network])

  // Use `useNodeInfos` to manage `nodeInfos` state and observable
  const nodeInfos = useNodeInfos({
    addressesFetched,
    walletAddresses,
    userNodes$,
    getNodeInfos$,
    getNodeInfosMaya$
  })

  const removeNodeByAddress = useCallback(
    (node: Address) => {
      removeNodeByAddressService(node, network)
    },
    [removeNodeByAddressService, network]
  )

  const routeToAction = useCallback(
    (action: string, node: string, walletType: string) => {
      const networkPrefix = network === 'mainnet' ? '' : 's'
      const nodeChain = node.startsWith(`${networkPrefix}thor`) ? THORChain : MAYAChain
      const selectedAssetBalance = allBalances.filter(
        (balance) => balance.asset.chain === nodeChain && balance.walletType === walletType
      )
      if (selectedAssetBalance.length > 0) {
        const { asset, walletAddress, walletType, walletAccount, walletIndex, hdMode } = selectedAssetBalance[0]
        setSelectedAsset(
          O.some({
            asset,
            walletAddress,
            walletType, // This comes from the selected balance
            walletAccount,
            walletIndex,
            hdMode
          })
        )

        const path = walletRoutes.bondInteract.path({
          interactType: action
        })
        navigate(path)
      }
    },
    [allBalances, navigate, network, setSelectedAsset]
  )

  return (
    <>
      <Row justify="end" style={{ marginBottom: '20px' }}>
        <RefreshButton onClick={reloadNodeInfos} disabled={RD.isPending(nodeInfos)} />
      </Row>
      <AssetsNav />
      <Bonds
        addressValidationThor={validateAddressThor}
        addressValidationMaya={validateAddressMaya}
        nodes={nodeInfos}
        // TODO: Thorianite
        addWatchlist={() => {}}
        removeNode={removeNodeByAddress}
        goToNode={goToExplorerNodeAddress}
        goToAction={routeToAction}
        network={network}
        addNode={addNodeAddress}
        reloadNodeInfos={reloadNodeInfos}
        walletAddresses={walletAddresses}
      />
    </>
  )
}
