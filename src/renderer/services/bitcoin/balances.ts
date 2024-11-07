import { HDMode, WalletBalanceType, WalletType } from '../../../shared/wallet/types'
import { observableState } from '../../helpers/stateHelper'
import * as C from '../clients'
import { client$ } from './common'

/**
 * `ObservableState` to reload `Balances`
 * Sometimes we need to have a way to understand if it simple "load" or "reload" action
 * e.g. @see src/renderer/services/wallet/balances.ts:getChainBalance$
 */
const { get$: reloadBalances$, set: setReloadBalances } = observableState<boolean>(false)
const { get$: reloadLedgerBalances$, set: setReloadLedgerBalances } = observableState<boolean>(false)

const resetReloadBalances = (walletType: WalletType) => {
  if (walletType === WalletType.Keystore) {
    setReloadBalances(false)
  } else {
    setReloadLedgerBalances(false)
  }
}

const reloadBalances = (walletType: WalletType) => {
  if (walletType === WalletType.Keystore) {
    setReloadBalances(true)
  } else {
    setReloadLedgerBalances(true)
  }
}
// State of balances loaded by Client
const balances$ = ({
  walletType,
  walletAccount,
  walletIndex,
  walletBalanceType,
  hdMode
}: {
  walletType: WalletType
  walletAccount: number
  walletIndex: number
  walletBalanceType: WalletBalanceType
  hdMode: HDMode
}): C.WalletBalancesLD =>
  C.balances$({ client$, trigger$: reloadBalances$, walletType, walletAccount, walletIndex, hdMode, walletBalanceType })

// State of balances loaded by Client and Address
const getBalanceByAddress$ = (walletBalanceType: WalletBalanceType) =>
  C.balancesByAddress$({ client$, trigger$: reloadLedgerBalances$, walletBalanceType })

export { balances$, reloadBalances, getBalanceByAddress$, reloadBalances$, resetReloadBalances }
