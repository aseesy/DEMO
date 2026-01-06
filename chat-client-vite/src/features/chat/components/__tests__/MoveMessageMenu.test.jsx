/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MoveMessageMenu } from '../MoveMessageMenu.jsx';

expect.extend(matchers);

describe('MoveMessageMenu', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    messageId: 'msg-123',
    currentThreadId: 'thread-1',
    threads: [
      { id: 'thread-1', title: 'Thread 1', message_count: 5, is_archived: 0 },
      { id: 'thread-2', title: 'Thread 2', message_count: 3, is_archived: 0 },
      { id: 'thread-3', title: 'Thread 3', message_count: 2, is_archived: 1 },
    ],
    roomId: 'room-123',
    moveMessageToThread: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders move button', () => {
    render(<MoveMessageMenu {...defaultProps} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    expect(button).toBeInTheDocument();
  });

  it('shows dropdown menu when button is clicked', async () => {
    render(<MoveMessageMenu {...defaultProps} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Move to thread:/i)).toBeInTheDocument();
    });
  });

  it('shows Main Chat option', async () => {
    render(<MoveMessageMenu {...defaultProps} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/💬 Main Chat/i)).toBeInTheDocument();
    });
  });

  it('shows available threads in dropdown', async () => {
    render(<MoveMessageMenu {...defaultProps} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Thread 2/i)).toBeInTheDocument();
    });
  });

  it('filters out archived threads', async () => {
    render(<MoveMessageMenu {...defaultProps} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.queryByText(/Thread 3/i)).not.toBeInTheDocument();
    });
  });

  it('disables current thread option', async () => {
    render(<MoveMessageMenu {...defaultProps} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      const currentThreadButton = screen.getByText(/Thread 1/i).closest('button');
      expect(currentThreadButton).toBeDisabled();
    });
  });

  it('calls moveMessageToThread when Main Chat is selected', async () => {
    const moveMessageToThread = vi.fn();
    render(<MoveMessageMenu {...defaultProps} moveMessageToThread={moveMessageToThread} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      const mainChatButton = screen.getByText(/💬 Main Chat/i);
      fireEvent.click(mainChatButton);
    });
    
    expect(moveMessageToThread).toHaveBeenCalledWith('msg-123', null, 'room-123');
  });

  it('calls moveMessageToThread when thread is selected', async () => {
    const moveMessageToThread = vi.fn();
    render(<MoveMessageMenu {...defaultProps} moveMessageToThread={moveMessageToThread} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      const threadButton = screen.getByText(/Thread 2/i);
      fireEvent.click(threadButton);
    });
    
    expect(moveMessageToThread).toHaveBeenCalledWith('msg-123', 'thread-2', 'room-123');
  });

  it('closes menu after selection', async () => {
    const onClose = vi.fn();
    render(<MoveMessageMenu {...defaultProps} onClose={onClose} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      const mainChatButton = screen.getByText(/💬 Main Chat/i);
      fireEvent.click(mainChatButton);
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('closes menu when clicking outside', async () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <MoveMessageMenu {...defaultProps} onClose={onClose} />
      </div>
    );
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Move to thread:/i)).toBeInTheDocument();
    });
    
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows message when no threads available', async () => {
    render(
      <MoveMessageMenu
        {...defaultProps}
        threads={[{ id: 'thread-1', title: 'Thread 1', message_count: 5, is_archived: 1 }]}
      />
    );
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/No threads available/i)).toBeInTheDocument();
    });
  });

  it('handles null currentThreadId (message in main chat)', async () => {
    render(<MoveMessageMenu {...defaultProps} currentThreadId={null} />);
    
    const button = screen.getByTitle(/Move to thread/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      // All threads should be enabled (not disabled)
      const threadButtons = screen.getAllByRole('button');
      const thread2Button = threadButtons.find(b => b.textContent?.includes('Thread 2'));
      expect(thread2Button).not.toBeDisabled();
    });
  });
});

