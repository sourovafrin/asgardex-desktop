import React, { useCallback, useEffect, useState } from 'react'

import { Switch } from '@headlessui/react'
import clsx from 'clsx'
import * as FP from 'fp-ts/lib/function'

export type Props = {
  disabled?: boolean
  active?: boolean
  onChange?: (active: boolean) => void
  className?: string
}

export const SwitchButton: React.FC<Props> = (props): JSX.Element => {
  const { disabled, active: initialActive = true, onChange = FP.constVoid, className = '' } = props
  const [active, setActive] = useState(initialActive)

  const onChangeHandler = useCallback(
    (active: boolean) => {
      setActive(active)
      onChange(active)
    },
    [onChange]
  )

  useEffect(() => {
    setActive(initialActive)
  }, [initialActive])

  return (
    <Switch
      disabled={disabled}
      checked={active}
      onChange={onChangeHandler}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        active ? 'bg-turquoise' : 'bg-gray1 dark:bg-gray1d',
        className
      )}>
      <span className="sr-only">Enable notifications</span>
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white',
          active ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </Switch>
  )
}
