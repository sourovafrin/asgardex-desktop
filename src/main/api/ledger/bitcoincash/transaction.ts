import Transport from '@ledgerhq/hw-transport'
import { AssetBCH, ClientLedger, defaultBchParams } from '@xchainjs/xchain-bitcoincash'
import { FeeOption, FeeRate, Network, TxHash } from '@xchainjs/xchain-client'
import { Address, BaseAmount, baseAmount } from '@xchainjs/xchain-util'
import * as E from 'fp-ts/lib/Either'

import { LedgerError, LedgerErrorId } from '../../../../shared/api/types'
import { isError } from '../../../../shared/utils/guard'
import { getDerivationPaths } from './common'

/**
 * Sends BCH tx using Ledger
 */
export const send = async ({
  transport,
  network,
  sender,
  recipient,
  amount,
  feeOption,
  memo,
  walletAccount,
  walletIndex
}: {
  transport: Transport
  network: Network
  sender?: Address
  recipient: Address
  amount: BaseAmount
  feeOption: FeeOption
  feeRate: FeeRate
  memo?: string
  walletAccount: number
  walletIndex: number
}): Promise<E.Either<LedgerError, TxHash>> => {
  if (!sender) {
    return E.left({
      errorId: LedgerErrorId.GET_ADDRESS_FAILED,
      msg: `Getting sender address using Ledger failed`
    })
  }

  try {
    const clientLedger = new ClientLedger({
      transport,
      ...defaultBchParams,
      rootDerivationPaths: getDerivationPaths(walletAccount, network),
      network: network
    })
    const fee = await clientLedger.getFeesWithRates({ sender, memo })
    const feeAmount = fee.fees[feeOption]
    const feeRate = fee.rates[feeOption]
    const bal = await clientLedger.getBalance(sender)
    const bchBalance = bal[0]
    const transactionSize = feeAmount.amount().toNumber() / feeRate
    const roundedFeeRate = Math.ceil(feeRate)
    const adjustedFee = baseAmount(roundedFeeRate * transactionSize)
    let amountToSend: BaseAmount
    if (amount.plus(adjustedFee).gte(bchBalance.amount)) {
      amountToSend = bchBalance.amount.minus(adjustedFee)
    } else {
      amountToSend = amount
    }
    const txHash = await clientLedger.transfer({
      walletIndex,
      asset: AssetBCH,
      recipient,
      amount: amountToSend,
      memo,
      feeRate
    })
    if (!txHash) {
      return E.left({
        errorId: LedgerErrorId.INVALID_RESPONSE,
        msg: `Post request to send BCH transaction using Ledger failed`
      })
    }
    return E.right(txHash)
  } catch (error) {
    return E.left({
      errorId: LedgerErrorId.SEND_TX_FAILED,
      msg: isError(error) ? error?.message ?? error.toString() : `${error}`
    })
  }
}
