'use client';
import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function ActivationCodeInput({ value, onChange, hasError }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 5 }, (_, i) => value[i] ?? '');

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function updateDigit(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d));
    onChange(next.join('').replace(/\s/g, ''));
  }

  function handleInput(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) return;
    updateDigit(index, char);
    if (index < 4) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        updateDigit(index, '');
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        updateDigit(index - 1, '');
      }
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 5);
    onChange(pasted.padEnd(5, '').slice(0, 5).trimEnd());
    const focusIndex = Math.min(pasted.length, 4);
    refs.current[focusIndex]?.focus();
  }

  const cellBase =
    'w-12 h-14 text-center text-[26px] font-bold rounded-md border outline-none transition-shadow bg-surface text-text shadow-sm';

  return (
    <fieldset className='flex gap-2.5 justify-center border-0 p-0 m-0'>
      <legend className='sr-only'>Activation code</legend>
      {digits.map((digit, i) => {
        const hasDigit = digit.trim() !== '';
        const borderClass = hasError
          ? 'border-danger'
          : hasDigit
            ? 'border-primary ring-3 ring-primary/13'
            : 'border-border-strong';

        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit.trim()}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1} of 5`}
            aria-invalid={hasError}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            className={`${cellBase} ${borderClass}`}
          />
        );
      })}
    </fieldset>
  );
}
