import * as AIcons from '@ant-design/icons/lib'
import { CaretRightOutlined } from '@ant-design/icons/lib'
import styled from 'styled-components'
import { palette } from 'styled-theme'

import { AddressEllipsis as UIAddressEllipsis } from '../../uielements/addressEllipsis'
import { ButtonProps, Button as UIButton } from '../../uielements/button'
import { Label as UILabel } from '../../uielements/label'
import { Table as UITable } from '../../uielements/table'

export const Table = styled(UITable)`
  .ant-table-thead > tr {
    background: ${palette('gray', 0)};
    & > th {
      font-size: 14px;
      border: none;
      padding-top: 6px;
      padding-bottom: 6px;
      height: auto;
      background: none !important;
      color: ${palette('gray', 2)};
      font-weight: 300;

      &:hover {
        background: none !important;
      }
    }
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid ${palette('gray', 0)};
    padding: 10px 0 10px 15px;
    height: auto;

    &:last-child {
      padding-right: 15px;
    }
  }
`

export const AddressEllipsis = styled(UIAddressEllipsis)`
  font-weight: 300;
  font-size: 16px;
  color: ${palette('text', 1)};
  text-transform: none;
`

export const InfoArrow = styled(AIcons.ArrowUpOutlined)`
  transform: rotateZ(45deg);
  color: ${palette('primary', 0)};
`

export const TextLabel = styled(UILabel).attrs({ textTransform: 'uppercase' })`
  color: inherit;
  font-size: 16px;
  font-family: 'MainFontRegular';
  padding: 0;
`

export const WatchlistButton = styled(UIButton).attrs({ typevalue: 'transparent' })<
  ButtonProps & { isMonitoring?: 'true' | 'false' }
>`
  &.ant-btn {
    min-width: auto;
    padding: 0;
    color: ${({ isMonitoring }) => (isMonitoring ? '#23dcc8' : palette('gray', 1))};

    &:hover {
      color: #23dcc8;
    }
  }
`

export const DeleteButton = styled(UIButton).attrs({ typevalue: 'transparent' })`
  &.ant-btn {
    min-width: auto;
    padding: 0;
    color: ${palette('gray', 1)};

    &:hover {
      color: ${palette('error', 1)};
    }
  }
`

export const ConfirmationModalText = styled(UILabel)`
  font-family: 'MainFontRegular';
  text-transform: uppercase;
  text-align: center;
  font-size: 14px;
`

export const ConfirmationModalAddress = styled.span`
  text-transform: none;
  font-size: 16px;
  font-weight: 'bold';
  font-family: 'MainFontBold';
`

export const WalletTypeLabel = styled(UILabel)`
  color: inherit;
  text-align: center;
  font-size: 16px;
  font-family: 'MainFontRegular';
  padding: 0;
`

export const ExpandIcon = styled(CaretRightOutlined)`
  margin-top: 0px;
  svg {
    width: 20px;
    height: 20px;
    color: ${palette('primary', 0)};
  }
`
