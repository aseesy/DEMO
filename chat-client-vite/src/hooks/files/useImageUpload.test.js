/**
 * useImageUpload Hook Unit Tests
 *
 * Tests for pure functions and hook behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  validateImageFile,
  fileToDataURL,
  useImageUpload,
} from './useImageUpload.js';
import { IMAGE_UPLOAD_CONFIG } from '../../config/profileConfig.js';

describe('validateImageFile', () => {
  describe('with valid files', () => {
    it('should accept valid image file under size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept png files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should accept gif files', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should accept webp files', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should accept file at exactly max size', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: IMAGE_UPLOAD_CONFIG.maxSizeBytes });

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });
  });

  describe('with invalid files', () => {
    it('should reject null file', () => {
      const result = validateImageFile(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file selected');
    });

    it('should reject undefined file', () => {
      const result = validateImageFile(undefined);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file selected');
    });

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select an image file');
    });

    it('should reject text files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select an image file');
    });

    it('should reject files over size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: IMAGE_UPLOAD_CONFIG.maxSizeBytes + 1 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(`Image must be less than ${IMAGE_UPLOAD_CONFIG.maxSizeMB}MB`);
    });
  });

  describe('with custom config', () => {
    it('should use custom size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      const customConfig = { maxSizeBytes: 1024 * 1024, maxSizeMB: 1 }; // 1MB limit
      const result = validateImageFile(file, customConfig);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image must be less than 1MB');
    });

    it('should accept file under custom size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 512 * 1024 }); // 512KB

      const customConfig = { maxSizeBytes: 1024 * 1024, maxSizeMB: 1 }; // 1MB limit
      const result = validateImageFile(file, customConfig);

      expect(result.valid).toBe(true);
    });
  });
});

describe('fileToDataURL', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.restoreAllMocks();
  });

  it('should convert file to data URL', async () => {
    const content = 'test image content';
    const file = new File([content], 'test.jpg', { type: 'image/jpeg' });

    const result = await fileToDataURL(file);

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('should handle empty file', async () => {
    const file = new File([], 'empty.jpg', { type: 'image/jpeg' });

    const result = await fileToDataURL(file);

    expect(result).toBe('data:image/jpeg;base64,');
  });

  it('should reject on FileReader error', async () => {
    // Create a mock file that will cause an error
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock FileReader to trigger error
    const originalFileReader = global.FileReader;
    global.FileReader = class MockFileReader {
      readAsDataURL() {
        setTimeout(() => {
          this.onerror(new Error('Read error'));
        }, 0);
      }
    };

    await expect(fileToDataURL(file)).rejects.toThrow('Failed to read file');

    global.FileReader = originalFileReader;
  });
});

describe('useImageUpload hook', () => {
  let onImageSelected;
  let onError;

  beforeEach(() => {
    onImageSelected = vi.fn();
    onError = vi.fn();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useImageUpload({ onImageSelected }));

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.fileInputRef).toBeDefined();
    });

    it('should return action functions', () => {
      const { result } = renderHook(() => useImageUpload({ onImageSelected }));

      expect(typeof result.current.openFilePicker).toBe('function');
      expect(typeof result.current.handleFileSelect).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should return inputProps with correct structure', () => {
      const { result } = renderHook(() => useImageUpload({ onImageSelected }));

      expect(result.current.inputProps.type).toBe('file');
      expect(result.current.inputProps.accept).toBe('image/*');
      expect(result.current.inputProps.className).toBe('hidden');
      expect(result.current.inputProps.onChange).toBe(result.current.handleFileSelect);
    });
  });

  describe('handleFileSelect', () => {
    it('should process valid image file', async () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError })
      );

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const event = {
        target: { files: [file], value: 'test.jpg' },
      };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      await waitFor(() => {
        expect(onImageSelected).toHaveBeenCalled();
      });

      const [dataURL, receivedFile] = onImageSelected.mock.calls[0];
      expect(dataURL).toMatch(/^data:image\/jpeg;base64,/);
      expect(receivedFile).toBe(file);
      expect(result.current.error).toBe(null);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle invalid file type', async () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError })
      );

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      const event = {
        target: { files: [file], value: 'test.pdf' },
      };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(onError).toHaveBeenCalledWith('Please select an image file');
      expect(result.current.error).toBe('Please select an image file');
      expect(onImageSelected).not.toHaveBeenCalled();
    });

    it('should handle file too large', async () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError })
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const event = {
        target: { files: [file], value: 'test.jpg' },
      };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(onError).toHaveBeenCalledWith('Image must be less than 5MB');
      expect(result.current.error).toBe('Image must be less than 5MB');
      expect(onImageSelected).not.toHaveBeenCalled();
    });

    it('should handle no file selected', async () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError })
      );

      const event = {
        target: { files: [], value: '' },
      };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(onImageSelected).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should reset input after processing', async () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError })
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const event = {
        target: { files: [file], value: 'test.jpg' },
      };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(event.target.value).toBe('');
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError })
      );

      // First trigger an error
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(result.current.error).toBe('Please select an image file');

      // Now clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('openFilePicker', () => {
    it('should call click on file input ref', () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected })
      );

      // Create a mock element and attach to ref
      const mockClick = vi.fn();
      result.current.fileInputRef.current = { click: mockClick };

      act(() => {
        result.current.openFilePicker();
      });

      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle null ref gracefully', () => {
      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected })
      );

      // Ensure ref is null
      result.current.fileInputRef.current = null;

      // Should not throw
      act(() => {
        result.current.openFilePicker();
      });
    });
  });

  describe('with custom config', () => {
    it('should use custom config for validation', async () => {
      const customConfig = { maxSizeBytes: 1024, maxSizeMB: 0.001, acceptAttribute: 'image/png' };

      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, onError, config: customConfig })
      );

      // File is 2KB, limit is 1KB
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 2048 });

      const event = {
        target: { files: [file], value: 'test.jpg' },
      };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(onError).toHaveBeenCalledWith('Image must be less than 0.001MB');
    });

    it('should use custom accept attribute in inputProps', () => {
      const customConfig = { maxSizeBytes: 1024, maxSizeMB: 1, acceptAttribute: 'image/png,image/jpeg' };

      const { result } = renderHook(() =>
        useImageUpload({ onImageSelected, config: customConfig })
      );

      expect(result.current.inputProps.accept).toBe('image/png,image/jpeg');
    });
  });

  describe('default options', () => {
    it('should work with no options provided', () => {
      const { result } = renderHook(() => useImageUpload());

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.inputProps.accept).toBe('image/*');
    });

    it('should use default alert for onError if not provided', async () => {
      const alertMock = vi.spyOn(global, 'alert').mockImplementation(() => {});

      const { result } = renderHook(() => useImageUpload());

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } };

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(alertMock).toHaveBeenCalledWith('Please select an image file');

      alertMock.mockRestore();
    });
  });
});
