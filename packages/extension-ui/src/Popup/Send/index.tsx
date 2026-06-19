// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — native send (transfer) UI
// SPDX-License-Identifier: Apache-2.0

import type { RouteComponentProps } from 'react-router';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { withRouter } from 'react-router';

import { ALICE_DECIMALS, ALICE_TOKEN_SYMBOL } from '@polkadot/extension-base/alice';
import { BN, formatBalance } from '@polkadot/util';

import { estimateTransfer } from '../../alice/estimate.js';
import { submitAliceTransfer, TransferPrecheckError } from '../../alice/submitTransfer.js';
import { evaluateHeadroom, isValidAliceAddress, parseAliceAmount } from '../../alice/transfer.js';
import { ActionBar, ActionContext, ActionText, Address, Button, InputWithLabel, Warning } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { Header } from '../../partials/index.js';
import { styled } from '../../styled.js';

interface Props extends RouteComponentProps<{ address: string }> {
  className?: string;
}

type Step = 'form' | 'review' | 'done' | 'uncertain';

function fmt (planck: bigint): string {
  return formatBalance(new BN(planck.toString()), {
    decimals: ALICE_DECIMALS,
    forceUnit: '-',
    withSi: false,
    withZero: true
  });
}

interface Estimate {
  amountPlanck: bigint;
  fee: bigint;
  free: bigint;
  existentialDeposit: bigint;
  remaining: bigint;
}

function Send ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [step, setStep] = useState<Step>('form');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const recipientError = useMemo(
    () => recipient.length > 0 && !isValidAliceAddress(recipient),
    [recipient]
  );

  const amountError = useMemo(() => {
    if (amount.length === 0) {
      return false;
    }

    try {
      parseAliceAmount(amount);

      return false;
    } catch {
      return true;
    }
  }, [amount]);

  const canReview = recipient.length > 0 && !recipientError && amount.length > 0 && !amountError;

  const _goHome = useCallback(() => onAction('/'), [onAction]);

  // FORM → REVIEW: validate, fetch fee + balance + ED, run the headroom gate.
  const _onReview = useCallback((): void => {
    setError('');

    if (!isValidAliceAddress(recipient)) {
      setError(t('Invalid recipient — must be a valid Alice (ss58-300) address'));

      return;
    }

    let amountPlanck: bigint;

    try {
      amountPlanck = parseAliceAmount(amount);
    } catch (e) {
      setError((e as Error).message);

      return;
    }

    setIsBusy(true);

    estimateTransfer(address, recipient, amountPlanck)
      .then(({ existentialDeposit, fee, free }) => {
        const headroom = evaluateHeadroom({ amount: amountPlanck, existentialDeposit, fee, free });

        if (!headroom.ok) {
          if (headroom.reason === 'balance-unknown') {
            setError(t('Balance unknown — cannot send while the node is unreachable'));
          } else {
            setError(t('Insufficient funds: amount + fee + existential-deposit reserve exceeds your balance'));
          }

          setIsBusy(false);

          return;
        }

        setEstimate({
          amountPlanck,
          existentialDeposit,
          fee,
          free,
          remaining: free - amountPlanck - fee
        });
        setStep('review');
        setIsBusy(false);
      })
      .catch((e: Error) => {
        setError(t('Could not reach the Alice node to estimate the fee: {{msg}}', { replace: { msg: e.message } }));
        setIsBusy(false);
      });
  }, [address, amount, recipient, t]);

  // REVIEW → submit. Requires a password; signs in the background, submits.
  const _onConfirm = useCallback((): void => {
    if (!estimate) {
      return;
    }

    setError('');
    setIsBusy(true);

    submitAliceTransfer(address, recipient, estimate.amountPlanck, pass)
      .then((result) => {
        setTxHash(result.txHash ?? '');
        setResultMsg(result.message);
        setStep(result.kind === 'success' ? 'done' : 'uncertain');
        setIsBusy(false);
      })
      .catch((e: Error) => {
        if (e instanceof TransferPrecheckError) {
          // Nothing was broadcast — safe to fix and retry on the review step.
          setError(e.message);
          setIsBusy(false);

          return;
        }

        // PENDING: broadcast may have occurred — show the uncertain state, never
        // present it as a clean failure (double-spend risk on naive retry).
        setResultMsg(e.message);
        setStep('uncertain');
        setIsBusy(false);
      });
  }, [address, estimate, pass, recipient]);

  const _onRecipientChange = useCallback((v: string): void => {
    setRecipient(v.trim());
    setError('');
  }, []);

  const _onAmountChange = useCallback((v: string): void => {
    setAmount(v);
    setError('');
  }, []);

  const _onPassChange = useCallback((v: string): void => {
    setPass(v);
    setError('');
  }, []);

  const _onBackToForm = useCallback((): void => {
    setStep('form');
    setError('');
    setPass('');
  }, []);

  return (
    <>
      <Header
        showBackArrow
        text={t('Send {{token}}', { replace: { token: ALICE_TOKEN_SYMBOL } })}
      />
      <div className={className}>
        <Address address={address}>
          {step === 'form' && (
            <div className='actionArea'>
              <InputWithLabel
                data-send-recipient
                isError={recipientError}
                label={t('Recipient address')}
                onChange={_onRecipientChange}
                value={recipient}
              />
              {recipientError && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {t('Not a valid Alice (ss58-300) address')}
                </Warning>
              )}
              <InputWithLabel
                data-send-amount
                isError={amountError}
                label={t('Amount ({{token}})', { replace: { token: ALICE_TOKEN_SYMBOL } })}
                onChange={_onAmountChange}
                value={amount}
              />
              {amountError && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {t('Enter a valid amount (up to {{dp}} decimals)', { replace: { dp: ALICE_DECIMALS } })}
                </Warning>
              )}
              <InputWithLabel
                data-send-note
                label={t('Note (optional, NOT stored on-chain)')}
                onChange={setNote}
                value={note}
              />
              {error && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {error}
                </Warning>
              )}
              <Button
                data-send-review
                isBusy={isBusy}
                isDisabled={!canReview || isBusy}
                onClick={_onReview}
              >
                {t('Review')}
              </Button>
              <ActionBar className='withMarginTop'>
                <ActionText
                  className='center'
                  onClick={_goHome}
                  text={t('Cancel')}
                />
              </ActionBar>
            </div>
          )}
          {step === 'review' && estimate && (
            <div className='actionArea'>
              <div className='reviewRow'>
                <span className='label'>{t('To')}</span>
                <span className='value mono'>{recipient}</span>
              </div>
              <div className='reviewRow'>
                <span className='label'>{t('Amount')}</span>
                <span className='value mono'>{fmt(estimate.amountPlanck)} {ALICE_TOKEN_SYMBOL}</span>
              </div>
              <div className='reviewRow'>
                <span className='label'>{t('Estimated network fee')}</span>
                <span className='value mono'>{fmt(estimate.fee)} {ALICE_TOKEN_SYMBOL}</span>
              </div>
              <div className='reviewRow'>
                <span className='label'>{t('Balance after')}</span>
                <span className='value mono'>{fmt(estimate.remaining)} {ALICE_TOKEN_SYMBOL}</span>
              </div>
              {note && (
                <div className='reviewRow'>
                  <span className='label'>{t('Note')}</span>
                  <span className='value'>{note}</span>
                </div>
              )}
              <Warning className='kaWarning'>
                {t('transferKeepAlive: a {{ed}} {{token}} reserve is kept so this send cannot reap your account.', { replace: { ed: fmt(estimate.existentialDeposit), token: ALICE_TOKEN_SYMBOL } })}
              </Warning>
              <InputWithLabel
                data-send-password
                disabled={isBusy}
                isError={!!error}
                label={t('Password for this account')}
                onChange={_onPassChange}
                type='password'
              />
              {error && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {error}
                </Warning>
              )}
              <Button
                data-send-confirm
                isBusy={isBusy}
                isDisabled={pass.length === 0 || isBusy}
                onClick={_onConfirm}
              >
                {t('Confirm & Send')}
              </Button>
              <ActionBar className='withMarginTop'>
                <ActionText
                  className='center'
                  onClick={_onBackToForm}
                  text={t('Back')}
                />
              </ActionBar>
            </div>
          )}
          {step === 'done' && (
            <div className='actionArea'>
              <div className='resultOk'>{t('Transfer sent')}</div>
              <div className='resultMsg'>{resultMsg}</div>
              {txHash && (
                <div className='reviewRow'>
                  <span className='label'>{t('Tx hash')}</span>
                  <span className='value mono'>{txHash}</span>
                </div>
              )}
              <Button
                data-send-done
                onClick={_goHome}
              >
                {t('Done')}
              </Button>
            </div>
          )}
          {step === 'uncertain' && (
            <div className='actionArea'>
              <Warning isDanger>
                {t('Uncertain — the transfer may have broadcast. Check Activity before retrying to avoid a double-spend.')}
              </Warning>
              <div className='resultMsg'>{resultMsg}</div>
              {txHash && (
                <div className='reviewRow'>
                  <span className='label'>{t('Tx hash')}</span>
                  <span className='value mono'>{txHash}</span>
                </div>
              )}
              <Button
                data-send-uncertain-home
                onClick={_goHome}
              >
                {t('Back to accounts')}
              </Button>
            </div>
          )}
        </Address>
      </div>
    </>
  );
}

export default withRouter(styled(Send)`
  .actionArea {
    padding: 10px 24px;
  }

  .center {
    margin: auto;
  }

  .withMarginTop {
    margin-top: 6px;
  }

  .reviewRow {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }

  .reviewRow .label {
    color: var(--labelColor, var(--subTextColor));
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .reviewRow .value {
    font-size: 14px;
    word-break: break-all;
  }

  .mono {
    font-family: var(--fontFamilyMono, 'JetBrains Mono', monospace);
  }

  .kaWarning {
    margin: 4px 0 12px;
  }

  .resultOk {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .resultMsg {
    color: var(--subTextColor);
    font-size: 13px;
    margin-bottom: 12px;
    word-break: break-all;
  }
`);
