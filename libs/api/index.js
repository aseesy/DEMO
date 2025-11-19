/**
 * API Library
 * 
 * Shared API client code and request handlers.
 */

/**
 * Create an API client with default configuration
 * @param {Object} config - API configuration
 * @returns {Object} API client methods
 */
export function createApiClient(config = {}) {
  const {
    baseURL = '',
    timeout = 30000,
    headers = {},
  } = config;

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async function request(endpoint, options = {}) {
    const url = `${baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  return {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, data, options) => request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
    put: (endpoint, data, options) => request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  };
}

/**
 * Handle API response with error handling
 * @param {Promise<Response>} responsePromise - Fetch response promise
 * @returns {Promise<Object>} Parsed response data
 */
export async function handleApiResponse(responsePromise) {
  try {
    const response = await responsePromise;
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `API request failed: ${response.status}`);
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

