/**
 * PWAUpdateBanner Component Tests
 *
 * Tests for the PWA update notification banner component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAUpdateBanner } from './PWAUpdateBanner.jsx';

describe('PWAUpdateBanner', () => {
  let mockOnUpdate;
  let mockOnDismiss;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    mockOnDismiss = vi.fn();
  });

  it('should render update banner with correct content', () => {
    render(<PWAUpdateBanner onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('New version available')).toBeInTheDocument();
    expect(screen.getByText(/Update now to get the latest features/)).toBeInTheDocument();
    expect(screen.getByText('Update Now')).toBeInTheDocument();
  });

  it('should call onUpdate when Update Now button is clicked', () => {
    render(<PWAUpdateBanner onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />);

    const updateButton = screen.getByText('Update Now');
    fireEvent.click(updateButton);

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('should call onDismiss when close button is clicked', () => {
    render(<PWAUpdateBanner onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />);

    const closeButton = screen.getByLabelText('Dismiss update notification');
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should have correct ARIA attributes', () => {
    render(<PWAUpdateBanner onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('should have correct styling classes', () => {
    const { container } = render(
      <PWAUpdateBanner onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />
    );

    const banner = container.firstChild;
    expect(banner).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'bg-teal-dark');
  });

  it('should be accessible with keyboard navigation', () => {
    render(<PWAUpdateBanner onUpdate={mockOnUpdate} onDismiss={mockOnDismiss} />);

    // Find all buttons - the Update Now button and close button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);

    // Both buttons should not have tabIndex of -1 (should be focusable)
    buttons.forEach(button => {
      expect(button.tabIndex).not.toBe(-1);
    });

    // Close button should have accessible label
    const closeButton = screen.getByLabelText('Dismiss update notification');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe('BUTTON');
  });
});
