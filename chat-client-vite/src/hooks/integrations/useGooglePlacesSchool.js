import { useEffect, useState } from 'react';

/**
 * Custom hook to load Google Places API (New) and initialize PlaceAutocompleteElement for schools
 * @param {Object} inputRef - React ref to the input element
 * @param {Function} onPlaceSelected - Callback when a place is selected
 * @returns {Object} - Loading state and error state
 */
export function useGooglePlacesSchool(inputRef, onPlaceSelected) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteElementRef = { current: null };

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      // Use a specific error code for easier handling in UI
      setError('GOOGLE_PLACES_NOT_CONFIGURED');
      console.warn(
        'Google Places API key not configured. School autocomplete will be unavailable. Set VITE_GOOGLE_PLACES_API_KEY in your .env file.'
      );
      return;
    }

    // Helper to check if loaded
    const isGoogleMapsLoaded = () => {
      return !!(window.google && window.google.maps && window.google.maps.importLibrary);
    };

    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      setIsLoaded(true);
      return;
    }

    // Check if script exists in DOM (loaded by useGooglePlaces)
    const existingScript = Array.from(document.querySelectorAll('script')).find(
      s => s.src && s.src.includes('maps.googleapis.com/maps/api/js')
    );

    if (existingScript) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup interval after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!isGoogleMapsLoaded()) {
          setError('Timeout waiting for Google Maps to load');
        }
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }

    // Load the script if it doesn't exist
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Places API');
    };

    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete when loaded
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
          includedRegionCodes: ['US'],
          includedPrimaryTypes: ['establishment'],
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
                  console.warn('[useGooglePlacesSchool] No place data in event');
                  return;
                }

                // Get display name - try different property names
                const displayName = place.displayName || place.name || '';

                if (!displayName) {
                  return;
                }

                // Update the React input value
                if (inputRef.current) {
                  inputRef.current.value = displayName;
                  // Trigger React onChange if needed
                  const event = new Event('input', { bubbles: true });
                  inputRef.current.dispatchEvent(event);
                }

                // Return school info with coordinates for distance calculation
                const schoolInfo = {
                  name: displayName,
                  address: place.formattedAddress || place.formatted_address || '',
                  placeId: place.id || place.place_id || '',
                  types: place.types || [],
                  lat: place.location?.lat
                    ? typeof place.location.lat === 'function'
                      ? place.location.lat()
                      : place.location.lat
                    : null,
                  lng: place.location?.lng
                    ? typeof place.location.lng === 'function'
                      ? place.location.lng()
                      : place.location.lng
                    : null,
                };

                if (onPlaceSelected) {
                  onPlaceSelected(schoolInfo);
                }
              })
              .catch(err => {
                console.error('[useGooglePlacesSchool] Error processing place selection:', err);
              });
          } catch (err) {
            console.error('[useGooglePlacesSchool] Error in event handler:', err);
          }
        };

        autocompleteElement.addEventListener('gmp-select', selectListener);

        // Store reference for cleanup
        autocompleteElementRef.current = autocompleteElement;
      } catch (err) {
        console.error(
          '[useGooglePlacesSchool] Failed to initialize PlaceAutocompleteElement:',
          err
        );
        setError('Failed to initialize school autocomplete: ' + err.message);
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
