import React, { useMemo } from 'react'

import { Network } from '@xchainjs/xchain-client'
import { Chain } from '@xchainjs/xchain-util'
import { useIntl } from 'react-intl'

import { isLedgerWallet } from '../../../../../shared/utils/guard'
import { WalletType } from '../../../../../shared/wallet/types'
import { getChainAsset, isThorChain } from '../../../../helpers/chainHelper'
import * as Styled from './Interact.styles'
import { InteractType } from './Interact.types'

type Props = {
  children?: React.ReactNode
  interactType: InteractType
  interactTypeChanged: (type: InteractType) => void
  walletType: WalletType
  network: Network
  chain: Chain
}

export const Interact: React.FC<Props> = ({
  interactType,
  interactTypeChanged,
  network,
  walletType,
  chain,
  children
}) => {
  const intl = useIntl()
  const name = isThorChain(chain) ? InteractType.THORName : InteractType.MAYAName
  const tabs: Array<{ type: InteractType; label: string }> = useMemo(
    () => [
      { type: InteractType.Bond, label: intl.formatMessage({ id: 'deposit.interact.actions.bond' }) },
      { type: InteractType.Unbond, label: intl.formatMessage({ id: 'deposit.interact.actions.unbond' }) },
      { type: InteractType.Leave, label: intl.formatMessage({ id: 'deposit.interact.actions.leave' }) },
      { type: InteractType.RunePool, label: intl.formatMessage({ id: 'deposit.interact.actions.runePool' }) },
      { type: InteractType.Custom, label: intl.formatMessage({ id: 'common.custom' }) },
      { type: name, label: intl.formatMessage({ id: `common.${name}` }) }
    ],
    [intl, name]
  )
  const asset = getChainAsset(chain)

  return (
    <Styled.Container>
      <Styled.Header>
        <Styled.AssetIcon network={network} asset={asset} />
        <div>
          <Styled.HeaderTitleWrapper>
            <Styled.HeaderTitle>{intl.formatMessage({ id: 'deposit.interact.title' })}</Styled.HeaderTitle>
            {isLedgerWallet(walletType) && (
              <Styled.WalletTypeLabel>{intl.formatMessage({ id: 'ledger.title' })}</Styled.WalletTypeLabel>
            )}
          </Styled.HeaderTitleWrapper>
          <Styled.HeaderSubtitle>
            {intl.formatMessage({ id: 'deposit.interact.subtitle' }, { chain: chain })}
          </Styled.HeaderSubtitle>
        </div>
      </Styled.Header>
      <Styled.FormWrapper>
        <Styled.Tabs
          activeKey={interactType}
          renderTabBar={() => (
            <Styled.TabButtonsContainer>
              {tabs.map(({ type, label }) => (
                <Styled.TabButton key={type} onClick={() => interactTypeChanged(type)} selected={type === interactType}>
                  {label}
                </Styled.TabButton>
              ))}
            </Styled.TabButtonsContainer>
          )}>
          {tabs.map(({ type }) => (
            <Styled.TabPane key={type}>{children}</Styled.TabPane>
          ))}
        </Styled.Tabs>
      </Styled.FormWrapper>
    </Styled.Container>
  )
}
