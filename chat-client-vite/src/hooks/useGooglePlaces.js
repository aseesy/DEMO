import { useEffect, useState } from 'react';

// Global state to track Google Maps script loading (singleton pattern)
let googleMapsLoadingState = {
  isLoading: false,
  isLoaded: false,
  error: null,
  script: null,
  listeners: new Set()
};

/**
 * Custom hook to load Google Places API and initialize autocomplete
 * @param {Object} inputRef - React ref to the input element
 * @param {Function} onPlaceSelected - Callback when a place is selected
 * @returns {Object} - Loading state and error state
 */
export function useGooglePlaces(inputRef, onPlaceSelected) {
  const [isLoaded, setIsLoaded] = useState(googleMapsLoadingState.isLoaded);
  const [error, setError] = useState(googleMapsLoadingState.error);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    // Debug logging to help diagnose configuration issues
    if (import.meta.env.DEV) {
      console.log('Google Places API Key check:', {
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.substring(0, 10) || 'none',
        allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE'))
      });
    }

    if (!apiKey || apiKey.trim() === '') {
      // Use specific error code for easier handling in UI components
      const errorCode = 'GOOGLE_PLACES_NOT_CONFIGURED';
      googleMapsLoadingState.error = errorCode;
      setError(errorCode);

      // Log warning in development
      if (import.meta.env.DEV) {
        console.warn('Google Places API key not configured - address autocomplete will be unavailable');
        console.warn('To configure: Set VITE_GOOGLE_PLACES_API_KEY in your .env file or Vercel environment variables');
      }
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      googleMapsLoadingState.isLoaded = true;
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded or already exists
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    
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
        if (window.google && window.google.maps && window.google.maps.places) {
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
