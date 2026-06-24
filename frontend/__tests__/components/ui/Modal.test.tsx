import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

vi.mock('primereact/dialog', () => ({
  Dialog: ({
    visible,
    onHide,
    children,
    pt,
  }: {
    visible: boolean;
    onHide: () => void;
    children?: React.ReactNode;
    pt?: { root?: { className?: string } };
  }) =>
    visible ? (
      <div
        data-testid='dialog'
        className={pt?.root?.className ?? ''}
        onClick={() => onHide()}
      >
        {children}
      </div>
    ) : null,
}));

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when open', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when the dialog is dismissed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByTestId('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies the default max-w-lg class to the dialog root', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        content
      </Modal>
    );
    expect(screen.getByTestId('dialog').className).toContain('max-w-lg');
  });

  it('applies a custom maxWidth class when provided', () => {
    render(
      <Modal open={true} onClose={vi.fn()} maxWidth='max-w-2xl'>
        content
      </Modal>
    );
    const dialog = screen.getByTestId('dialog');
    expect(dialog.className).toContain('max-w-2xl');
    expect(dialog.className).not.toContain('max-w-lg');
  });

  it('renders arbitrary children content inside the dialog', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <h2>Title</h2>
        <button>Submit</button>
      </Modal>
    );
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
