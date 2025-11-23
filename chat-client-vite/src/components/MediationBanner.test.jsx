/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import MediationBanner from './MediationBanner';

expect.extend(matchers);
import { useMediator } from '../context/MediatorContext';

// Mock the context hook
vi.mock('../context/MediatorContext', () => ({
    useMediator: vi.fn()
}));

describe('MediationBanner', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders nothing when needsMediation is false', () => {
        useMediator.mockReturnValue({
            needsMediation: false,
            setNeedsMediation: vi.fn()
        });

        const { container } = render(<MediationBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('renders banner when needsMediation is true', () => {
        useMediator.mockReturnValue({
            needsMediation: true,
            setNeedsMediation: vi.fn()
        });

        render(<MediationBanner />);
        expect(screen.getByText(/Mediation Suggestion/i)).toBeInTheDocument();
    });

    it('calls setNeedsMediation(false) when Dismiss is clicked', () => {
        const setNeedsMediation = vi.fn();
        useMediator.mockReturnValue({
            needsMediation: true,
            setNeedsMediation
        });

        render(<MediationBanner />);
        fireEvent.click(screen.getByText('Dismiss'));
        expect(setNeedsMediation).toHaveBeenCalledWith(false);
    });
});
