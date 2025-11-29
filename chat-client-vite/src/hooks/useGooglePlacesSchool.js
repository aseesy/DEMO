import { useEffect, useState } from 'react';

/**
 * Custom hook to load Google Places API and initialize autocomplete for schools
 * @param {Object} inputRef - React ref to the input element
 * @param {Function} onPlaceSelected - Callback when a place is selected
 * @returns {Object} - Loading state and error state
 */
export function useGooglePlacesSchool(inputRef, onPlaceSelected) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      // Use a specific error code for easier handling in UI
      setError('GOOGLE_PLACES_NOT_CONFIGURED');
      console.warn('Google Places API key not configured. School autocomplete will be unavailable. Set VITE_GOOGLE_PLACES_API_KEY in your .env file.');
      return;
    }

    // Helper to check if loaded
    const isGoogleMapsLoaded = () => {
      return !!(window.google && window.google.maps && window.google.maps.places);
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
  }, []);

  // Initialize autocomplete when loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    try {
      // Initialize autocomplete for schools/educational institutions
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['establishment'],
          componentRestrictions: { country: 'us' },
          fields: ['name', 'formatted_address', 'place_id', 'types', 'geometry'],
        }
      );

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.name) {
          return;
        }

        // Return school info with coordinates for distance calculation
        const schoolInfo = {
          name: place.name,
          address: place.formatted_address || '',
          placeId: place.place_id || '',
          types: place.types || [],
          lat: place.geometry?.location?.lat() || null,
          lng: place.geometry?.location?.lng() || null,
        };

        if (onPlaceSelected) {
          onPlaceSelected(schoolInfo);
        }
      });

      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error('Failed to initialize school autocomplete:', err);
      setError('Failed to initialize school autocomplete: ' + err.message);
    }
  }, [isLoaded, inputRef, onPlaceSelected]);

  return { isLoaded, error };
}
