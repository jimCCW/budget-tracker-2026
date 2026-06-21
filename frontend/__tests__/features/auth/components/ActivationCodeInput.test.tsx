import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivationCodeInput } from '@/features/auth/components/ActivationCodeInput';

function setup(value = '', onChange = vi.fn(), hasError = false) {
  render(
    <ActivationCodeInput
      value={value}
      onChange={onChange}
      hasError={hasError}
    />
  );
  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
  return { inputs, onChange };
}

describe('ActivationCodeInput', () => {
  it('renders 5 individual inputs', () => {
    const { inputs } = setup();
    expect(inputs).toHaveLength(5);
  });

  it('displays each character of the value in its corresponding input', () => {
    const { inputs } = setup('12345');
    expect(inputs[0].value).toBe('1');
    expect(inputs[4].value).toBe('5');
  });

  it('calls onChange with updated value when a digit is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ActivationCodeInput value='' onChange={onChange} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];

    await user.type(inputs[0], '7');

    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('7'));
  });

  it('ignores non-digit input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ActivationCodeInput value='' onChange={onChange} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];

    await user.type(inputs[0], 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with the digit cleared on Backspace when cell has value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ActivationCodeInput value='5    ' onChange={onChange} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];

    await user.click(inputs[0]);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('applies error border class when hasError is true', () => {
    const { inputs } = setup('', vi.fn(), true);
    expect(inputs[0].className).toContain('border-danger');
  });

  it('applies primary border class on filled cell without error', () => {
    const { inputs } = setup('9');
    expect(inputs[0].className).toContain('border-primary');
  });
});
