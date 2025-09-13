import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnsavedChangesModal from './UnsavedChangesModal';

describe('UnsavedChangesModal', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onDontSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with correct content', () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText(/You have unsaved changes to this chapter/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Don't Save" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onSave when Save button is clicked', async () => {
    const user = userEvent.setup();
    render(<UnsavedChangesModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    expect(defaultProps.onDontSave).not.toHaveBeenCalled();
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onDontSave when Don\'t Save button is clicked', async () => {
    const user = userEvent.setup();
    render(<UnsavedChangesModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: "Don't Save" }));

    expect(defaultProps.onDontSave).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<UnsavedChangesModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(defaultProps.onDontSave).not.toHaveBeenCalled();
  });

  it('displays warning icon', () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    // Check for SVG warning icon by looking for the SVG element
    const svg = document.querySelector('svg.h-6.w-6.text-orange-600');
    expect(svg).toBeInTheDocument();
  });

  it('has proper button styling and accessibility', () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    const dontSaveButton = screen.getByRole('button', { name: "Don't Save" });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    // Check buttons are focusable and have proper roles
    expect(saveButton).toHaveAttribute('type', 'button');
    expect(dontSaveButton).toHaveAttribute('type', 'button');
    expect(cancelButton).toHaveAttribute('type', 'button');

    // Check primary button has distinctive styling
    expect(saveButton).toHaveClass('bg-chrome-green-600');
    expect(dontSaveButton).toHaveClass('bg-white');
    expect(cancelButton).toHaveClass('bg-white');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<UnsavedChangesModal {...defaultProps} />);

    // Tab through buttons
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: "Don't Save" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('calls appropriate function when Enter is pressed on focused button', async () => {
    const user = userEvent.setup();
    render(<UnsavedChangesModal {...defaultProps} />);

    // Focus Save button and press Enter
    const saveButton = screen.getByRole('button', { name: 'Save' });
    saveButton.focus();
    await user.keyboard('{Enter}');

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('renders with proper modal overlay', () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    // Check for modal overlay
    const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    expect(overlay).toBeInTheDocument();

    // Check for modal container
    const modalContainer = document.querySelector('.bg-white.rounded-lg.shadow-xl');
    expect(modalContainer).toBeInTheDocument();
  });

  it('has responsive layout classes', () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const buttonContainer = document.querySelector('.flex.flex-col.space-y-2.sm\\:flex-row');
    expect(buttonContainer).toBeInTheDocument();
  });
});