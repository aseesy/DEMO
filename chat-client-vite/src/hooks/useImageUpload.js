/**
 * useImageUpload - Hook for handling image file uploads
 *
 * Responsibilities:
 * - File validation (type, size)
 * - FileReader conversion to DataURL
 * - Error handling
 *
 * Does NOT handle: UI rendering, where to store the result
 */

import { useRef, useCallback, useState } from 'react';
import { IMAGE_UPLOAD_CONFIG } from '../config/profileConfig.js';

/**
 * Validate an image file
 * @param {File} file - The file to validate
 * @param {Object} config - Validation config
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file, config = IMAGE_UPLOAD_CONFIG) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  if (file.size > config.maxSizeBytes) {
    return { valid: false, error: `Image must be less than ${config.maxSizeMB}MB` };
  }

  return { valid: true };
}

/**
 * Convert a file to a DataURL string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} DataURL string
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Hook for handling image uploads
 * @param {Object} options
 * @param {Function} options.onImageSelected - Callback when image is successfully processed
 * @param {Function} options.onError - Callback for errors (defaults to alert)
 * @param {Object} options.config - Upload config (defaults to IMAGE_UPLOAD_CONFIG)
 * @returns {Object} Upload state and handlers
 */
export function useImageUpload({
  onImageSelected,
  onError = (error) => alert(error),
  config = IMAGE_UPLOAD_CONFIG,
} = {}) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Open the file picker dialog
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle file selection from input
   * @param {Event} event - The change event from file input
   */
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, config);
    if (!validation.valid) {
      setError(validation.error);
      onError?.(validation.error);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const dataURL = await fileToDataURL(file);
      onImageSelected?.(dataURL, file);
    } catch (err) {
      const errorMessage = 'Failed to process image';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
      // Reset input so same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [config, onError, onImageSelected]);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Ref to attach to file input
    fileInputRef,

    // State
    isProcessing,
    error,

    // Actions
    openFilePicker,
    handleFileSelect,
    clearError,

    // Config for input element
    inputProps: {
      ref: fileInputRef,
      type: 'file',
      accept: config.acceptAttribute,
      onChange: handleFileSelect,
      className: 'hidden',
    },
  };
}

export default useImageUpload;
