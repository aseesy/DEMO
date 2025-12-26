import { useEffect, useState, useRef } from 'react';

// Global state to track Google Maps script loading (singleton pattern)
let googleMapsLoadingState = {
  isLoading: false,
  isLoaded: false,
  error: null,
  script: null,
  listeners: new Set(),
};

/**
 * Custom hook to load Google Places API (New) and initialize PlaceAutocompleteElement
 * @param {Object} inputRef - React ref to the input element
 * @param {Function} onPlaceSelected - Callback when a place is selected
 * @returns {Object} - Loading state and error state
 */
export function useGooglePlaces(inputRef, onPlaceSelected) {
  const [isLoaded, setIsLoaded] = useState(googleMapsLoadingState.isLoaded);
  const [error, setError] = useState(googleMapsLoadingState.error);
  const autocompleteElementRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    // Debug logging to help diagnose configuration issues
    if (import.meta.env.DEV) {
      console.log('Google Places API Key check:', {
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.substring(0, 10) || 'none',
        allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE')),
      });
    }

    if (!apiKey || apiKey.trim() === '') {
      // Use specific error code for easier handling in UI components
      const errorCode = 'GOOGLE_PLACES_NOT_CONFIGURED';
      googleMapsLoadingState.error = errorCode;
      setError(errorCode);

      // Log warning in development
      if (import.meta.env.DEV) {
        console.warn(
          'Google Places API key not configured - address autocomplete will be unavailable'
        );
        console.warn(
          'To configure: Set VITE_GOOGLE_PLACES_API_KEY in your .env file or Vercel environment variables'
        );
      }
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.importLibrary) {
      googleMapsLoadingState.isLoaded = true;
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded or already exists
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;

    // Check if script with this src already exists in DOM
    const existingScript = Array.from(document.querySelectorAll('script')).find(
      s => s.src && s.src.includes('maps.googleapis.com/maps/api/js')
    );

    if (existingScript) {
      // Script already exists in DOM, wait for it to load
      if (googleMapsLoadingState.isLoaded) {
        setIsLoaded(true);
      } else if (googleMapsLoadingState.isLoading) {
        // Script is loading, add this component to listeners
        const listener = () => setIsLoaded(true);
        googleMapsLoadingState.listeners.add(listener);
        return () => googleMapsLoadingState.listeners.delete(listener);
      } else {
        // Script exists but we don't know its state, check if it's loaded
        if (window.google && window.google.maps && window.google.maps.importLibrary) {
          googleMapsLoadingState.isLoaded = true;
          setIsLoaded(true);
        }
      }
      return;
    }

    // Start loading the script (only once)
    if (googleMapsLoadingState.isLoading) {
      // Already loading, just add listener
      const listener = () => setIsLoaded(true);
      googleMapsLoadingState.listeners.add(listener);
      return () => googleMapsLoadingState.listeners.delete(listener);
    }

    googleMapsLoadingState.isLoading = true;

    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoadingState.isLoaded = true;
      googleMapsLoadingState.isLoading = false;
      googleMapsLoadingState.script = script;

      // Notify all listeners
      googleMapsLoadingState.listeners.forEach(listener => listener());
      googleMapsLoadingState.listeners.clear();

      setIsLoaded(true);
    };

    script.onerror = () => {
      const errorMsg = 'Failed to load Google Places API';
      googleMapsLoadingState.error = errorMsg;
      googleMapsLoadingState.isLoading = false;
      setError(errorMsg);

      // Notify all listeners of error
      googleMapsLoadingState.listeners.forEach(listener => listener());
      googleMapsLoadingState.listeners.clear();
    };

    document.head.appendChild(script);
    googleMapsLoadingState.script = script;

    // Note: We don't remove the script on cleanup because other components might be using it
    // The script will remain in the DOM for the lifetime of the app
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    let autocompleteElement = null;
    let selectListener = null;

    const initializeAutocomplete = async () => {
      try {
        // Import Places library (New API)
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary('places');

        // Create the web component with configuration
        autocompleteElement = new PlaceAutocompleteElement({
          includedRegionCodes: ['US'], // Restrict to US addresses
          includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
        });

        // PlaceAutocompleteElement provides its own input, but we need to sync with our React input
        // We'll hide the PlaceAutocompleteElement's input and sync values
        const inputParent = inputRef.current.parentElement;
        if (inputParent) {
          // Append the autocomplete element to the parent
          inputParent.style.position = 'relative';
          autocompleteElement.style.position = 'absolute';
          autocompleteElement.style.top = '0';
          autocompleteElement.style.left = '0';
          autocompleteElement.style.width = '100%';
          autocompleteElement.style.height = '100%';
          autocompleteElement.style.opacity = '0';
          autocompleteElement.style.pointerEvents = 'auto';
          autocompleteElement.style.zIndex = '10';
          inputParent.appendChild(autocompleteElement);

          // Sync the PlaceAutocompleteElement's value with our React input
          const syncInput = () => {
            const gmpInput = autocompleteElement.querySelector('input');
            if (gmpInput && inputRef.current) {
              gmpInput.value = inputRef.current.value;
            }
          };

          // Sync on input changes
          inputRef.current.addEventListener('input', syncInput);
          syncInput();

          // Store sync function for cleanup
          autocompleteElement._syncInput = syncInput;
          autocompleteElement._inputListener = syncInput;
        }

        // Listen for place selection using the new gmp-select event
        selectListener = event => {
          try {
            // The place is available directly in event.place or via event.placePrediction.toPlace()
            const placePromise = event.place
              ? Promise.resolve(event.place)
              : event.placePrediction?.toPlace
                ? event.placePrediction.toPlace()
                : Promise.resolve(null);

            placePromise
              .then(place => {
                if (!place) {
                  console.warn('[useGooglePlaces] No place data in event');
                  return;
                }

                // Get formatted address - try different property names
                const formattedAddress = place.formattedAddress || place.formatted_address || '';

                if (!formattedAddress) {
                  return;
                }

                // Extract address components
                const addressComponents = {
                  street: '',
                  city: '',
                  state: '',
                  zip: '',
                  country: '',
                  fullAddress: formattedAddress,
                };

                // Handle address components - try both new and old API formats
                const components = place.addressComponents || place.address_components || [];
                components.forEach(component => {
                  const types = component.types || [];
                  const longText = component.longText || component.long_name || '';
                  const shortText = component.shortText || component.short_name || '';

                  if (types.includes('street_number')) {
                    addressComponents.street = longText + ' ';
                  }
                  if (types.includes('route')) {
                    addressComponents.street += longText;
                  }
                  if (types.includes('locality')) {
                    addressComponents.city = longText;
                  }
                  if (types.includes('administrative_area_level_1')) {
                    addressComponents.state = shortText;
                  }
                  if (types.includes('postal_code')) {
                    addressComponents.zip = longText;
                  }
                  if (types.includes('country')) {
                    addressComponents.country = shortText;
                  }
                });

                // Update the React input value
                if (inputRef.current) {
                  inputRef.current.value = formattedAddress;
                  // Trigger React onChange if needed
                  const event = new Event('input', { bubbles: true });
                  inputRef.current.dispatchEvent(event);
                }

                // Call the callback with the selected place
                if (onPlaceSelected) {
                  onPlaceSelected(addressComponents);
                }
              })
              .catch(err => {
                console.error('[useGooglePlaces] Error processing place selection:', err);
              });
          } catch (err) {
            console.error('[useGooglePlaces] Error in event handler:', err);
          }
        };

        autocompleteElement.addEventListener('gmp-select', selectListener);

        // Store reference for cleanup
        autocompleteElementRef.current = autocompleteElement;
      } catch (err) {
        console.error('[useGooglePlaces] Failed to initialize PlaceAutocompleteElement:', err);
        setError('Failed to initialize autocomplete: ' + err.message);
      }
    };

    initializeAutocomplete();

    // Cleanup on unmount
    return () => {
      if (autocompleteElementRef.current) {
        const element = autocompleteElementRef.current;
        if (selectListener) {
          element.removeEventListener('gmp-select', selectListener);
        }
        // Remove input sync listener
        if (element._inputListener && inputRef.current) {
          inputRef.current.removeEventListener('input', element._inputListener);
        }
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        autocompleteElementRef.current = null;
      }
    };
  }, [isLoaded, inputRef, onPlaceSelected]);

  return { isLoaded, error };
}
