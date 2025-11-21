import { useEffect, useState } from 'react';

/**
 * Custom hook to load Google Places API and initialize autocomplete
 * @param {Object} inputRef - React ref to the input element
 * @param {Function} onPlaceSelected - Callback when a place is selected
 * @returns {Object} - Loading state and error state
 */
export function useGooglePlaces(inputRef, onPlaceSelected) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      setError('Google Places API key not configured');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Places API');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts during loading
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    try {
      // Initialize autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' }, // Restrict to US addresses
          fields: ['formatted_address', 'address_components', 'geometry'],
        }
      );

      // Listen for place selection
      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.formatted_address) {
          return;
        }

        // Extract address components
        const addressComponents = {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          fullAddress: place.formatted_address,
        };

        place.address_components?.forEach((component) => {
          const types = component.types;

          if (types.includes('street_number')) {
            addressComponents.street = component.long_name + ' ';
          }
          if (types.includes('route')) {
            addressComponents.street += component.long_name;
          }
          if (types.includes('locality')) {
            addressComponents.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            addressComponents.state = component.short_name;
          }
          if (types.includes('postal_code')) {
            addressComponents.zip = component.long_name;
          }
          if (types.includes('country')) {
            addressComponents.country = component.short_name;
          }
        });

        // Call the callback with the selected place
        if (onPlaceSelected) {
          onPlaceSelected(addressComponents);
        }
      });

      // Cleanup listener on unmount
      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      setError('Failed to initialize autocomplete: ' + err.message);
    }
  }, [isLoaded, inputRef, onPlaceSelected]);

  return { isLoaded, error };
}
