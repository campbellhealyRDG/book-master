import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import FontSelector, { FONT_OPTIONS } from '../FontSelector';
import { useAppStore } from '../../../store';

// Mock the store
vi.mock('../../../store', () => ({
  useAppStore: vi.fn()
}));

describe('FontSelector', () => {
  const mockOnClose = vi.fn();
  const mockSetSelectedFont = vi.fn();
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockSetSelectedFont.mockClear();

    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: null,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });
  });

  test('renders when visible', () => {
    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Serif')).toBeInTheDocument();
    expect(screen.getByText('Sans-serif')).toBeInTheDocument();
    expect(screen.getByText('Monospace')).toBeInTheDocument();
  });

  test('does not render when not visible', () => {
    render(
      <FontSelector
        isVisible={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Select Writing Font')).not.toBeInTheDocument();
  });

  test('displays all font options by default', () => {
    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Should show all fonts from FONT_OPTIONS
    FONT_OPTIONS.forEach(font => {
      expect(screen.getByText(font.displayName)).toBeInTheDocument();
      expect(screen.getByText(font.description)).toBeInTheDocument();
    });
  });

  test('filters fonts by category', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Click serif filter
    const serifButton = screen.getByText('Serif');
    await user.click(serifButton);

    // Should only show serif fonts
    const serifFonts = FONT_OPTIONS.filter(font => font.category === 'serif');
    const nonSerifFonts = FONT_OPTIONS.filter(font => font.category !== 'serif');

    serifFonts.forEach(font => {
      expect(screen.getByText(font.displayName)).toBeInTheDocument();
    });

    nonSerifFonts.forEach(font => {
      expect(screen.queryByText(font.displayName)).not.toBeInTheDocument();
    });
  });

  test('filters fonts by sans-serif category', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Click sans-serif filter
    const sansSerifButton = screen.getByText('Sans-serif');
    await user.click(sansSerifButton);

    // Should only show sans-serif fonts
    const sansSerifFonts = FONT_OPTIONS.filter(font => font.category === 'sans-serif');

    sansSerifFonts.forEach(font => {
      expect(screen.getByText(font.displayName)).toBeInTheDocument();
    });

    // Should not show serif or monospace fonts
    const otherFonts = FONT_OPTIONS.filter(font => font.category !== 'sans-serif');
    otherFonts.forEach(font => {
      expect(screen.queryByText(font.displayName)).not.toBeInTheDocument();
    });
  });

  test('filters fonts by monospace category', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Click monospace filter
    const monospaceButton = screen.getByText('Monospace');
    await user.click(monospaceButton);

    // Should only show monospace fonts
    const monospaceFonts = FONT_OPTIONS.filter(font => font.category === 'monospace');

    monospaceFonts.forEach(font => {
      expect(screen.getByText(font.displayName)).toBeInTheDocument();
    });
  });

  test('resets to all fonts when All filter is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // First filter by serif
    await user.click(screen.getByText('Serif'));

    // Then click All
    await user.click(screen.getByText('All'));

    // Should show all fonts again
    FONT_OPTIONS.forEach(font => {
      expect(screen.getByText(font.displayName)).toBeInTheDocument();
    });
  });

  test('selects font when clicked', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');
    if (!georgiaFont) throw new Error('Georgia font not found in options');

    // Click on Georgia font
    const georgiaOption = screen.getByText(georgiaFont.displayName);
    await user.click(georgiaOption);

    expect(mockSetSelectedFont).toHaveBeenCalledWith(georgiaFont);
  });

  test('shows selected font with checkmark', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');
    if (!georgiaFont) throw new Error('Georgia font not found');

    // Mock store with selected font
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Should show checkmark for selected font
    const georgiaContainer = screen.getByText(georgiaFont.displayName).closest('div');
    expect(georgiaContainer).toHaveClass('bg-chrome-green-50');
  });

  test('shows preview for selected font', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');
    if (!georgiaFont) throw new Error('Georgia font not found');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Should show font info in preview panel
    expect(screen.getByText(georgiaFont.displayName)).toBeInTheDocument();
    expect(screen.getByText(georgiaFont.description)).toBeInTheDocument();
    expect(screen.getByText('Text Preview')).toBeInTheDocument();
    expect(screen.getByText('Different Sizes')).toBeInTheDocument();
  });

  test('shows placeholder when no font selected', () => {
    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Select a font to see preview')).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Find backdrop (the div with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  test('closes modal when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when Apply Font button is clicked', async () => {
    const user = userEvent.setup();
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const applyButton = screen.getByText('Apply Font');
    await user.click(applyButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Apply Font button is disabled when no font selected', () => {
    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const applyButton = screen.getByText('Apply Font');
    expect(applyButton).toBeDisabled();
  });

  test('Apply Font button is enabled when font is selected', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const applyButton = screen.getByText('Apply Font');
    expect(applyButton).not.toBeDisabled();
  });

  test('preview text displays correctly with font family', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');
    if (!georgiaFont) throw new Error('Georgia font not found');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const previewText = screen.getByText(/The quick brown fox jumps over the lazy dog/);
    expect(previewText).toHaveStyle({ fontFamily: georgiaFont.fallback });
  });

  test('font categories are highlighted correctly', async () => {
    const user = userEvent.setup();

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const serifButton = screen.getByText('Serif');

    // Initially All should be highlighted
    const allButton = screen.getByText('All');
    expect(allButton).toHaveClass('bg-chrome-green-100');

    // Click serif
    await user.click(serifButton);

    await waitFor(() => {
      expect(serifButton).toHaveClass('bg-chrome-green-100');
      expect(allButton).not.toHaveClass('bg-chrome-green-100');
    });
  });

  test('font options show correct category badges', () => {
    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    FONT_OPTIONS.forEach(font => {
      const expectedBadgeText = font.category.replace('-', ' ');
      // Find the font option container and check it contains the category
      const fontContainer = screen.getByText(font.displayName).closest('div');
      expect(fontContainer).toHaveTextContent(expectedBadgeText);
    });
  });

  test('preview shows different font sizes correctly', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');
    if (!georgiaFont) throw new Error('Georgia font not found');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <FontSelector
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Check for different size samples
    const smallText = screen.getByText(/Small \(14px\)/);
    expect(smallText).toHaveStyle({ fontSize: '14px' });

    const normalText = screen.getByText(/Normal \(16px\)/);
    expect(normalText).toHaveStyle({ fontSize: '16px' });

    const largeText = screen.getByText(/Large \(18px\)/);
    expect(largeText).toHaveStyle({ fontSize: '18px' });
  });
});