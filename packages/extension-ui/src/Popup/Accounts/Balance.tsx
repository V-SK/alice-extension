// Copyright 2025-2026 @alice-protocol authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { BalanceStatus } from '../../hooks/useAliceBalance.js';

import React from 'react';

import { useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';

interface Props {
  className?: string;
  free: string;
  status: BalanceStatus;
  token: string;
}

// Read-only balance row shown under each account. v1 has NO transfer; the
// hint points serious / sending users at the desktop wallet (embedded full
// node). This is the clean seam where v2 will add an in-popup "Send" action.
function Balance ({ className, free, status, token }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div className='balanceRow'>
        <span className='label'>{t('Balance')}</span>
        {status === 'error'
          ? <span className='value nodeDown'>{t('node unavailable')}</span>
          : (
            <span className='value'>
              <span className='amount'>{free}</span>
              <span className='token'>{token}</span>
            </span>
          )
        }
      </div>
      <div className='sendHint'>
        {t('To send ALICE, use the Alice desktop wallet (full node).')}
      </div>
    </div>
  );
}

export default styled(Balance)<Props>`
  margin: -2px 0 10px;
  padding: 0 16px 0 70px;

  .balanceRow {
    align-items: baseline;
    display: flex;
    justify-content: space-between;
  }

  .label {
    color: var(--labelColor, var(--subTextColor));
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .value {
    align-items: baseline;
    display: flex;
    font-family: var(--fontFamilyMono, 'JetBrains Mono', monospace);
    gap: 5px;
  }

  .amount {
    font-size: 15px;
    font-weight: 600;
  }

  .token {
    color: var(--subTextColor);
    font-size: 11px;
  }

  .nodeDown {
    color: var(--subTextColor);
    font-size: 12px;
    font-style: italic;
  }

  .sendHint {
    color: var(--subTextColor);
    font-size: 11px;
    margin-top: 3px;
    opacity: 0.75;
  }
`;
