// Utility to dynamically load Google Maps API
export const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already available');
      resolve(window.google.maps);
      return;
    }

    // Check if script is already being loaded
    if (window.googleMapsLoading) {
      console.log('Google Maps already loading, waiting...');
      window.googleMapsLoading.then(resolve).catch(reject);
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already in DOM');
      // Wait for it to load
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }
      // If script exists but not loaded, wait for it
      existingScript.addEventListener('load', () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps loaded but not available'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Google Maps script failed to load'));
      });
      return;
    }

    // Create a promise for the loading process
    window.googleMapsLoading = new Promise((resolveLoading, rejectLoading) => {
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      console.log('Google Maps API Key:', apiKey ? 'Present' : 'Missing');
      console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey.trim() === '') {
        rejectLoading(new Error('Google Maps API key not configured'));
        return;
      }

      // Test API key validity with a simple geocoding request
      console.log('Testing API key validity...');
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Boston&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
          console.log('API key test result:', data.status);
          if (data.status === 'REQUEST_DENIED') {
            console.error('Google Maps API key is invalid or restricted:', data.error_message);
          }
        })
        .catch(error => {
          console.log('API key test network error (this is expected in some cases):', error.message);
        });

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;

      // Add timeout
      const timeout = setTimeout(() => {
        rejectLoading(new Error('Google Maps API loading timeout'));
      }, 10000); // 10 second timeout

      script.onload = () => {
        clearTimeout(timeout);
        console.log('Google Maps script loaded');
        // Wait a bit for Google Maps to be fully initialized
        setTimeout(() => {
          if (window.google && window.google.maps) {
            resolveLoading(window.google.maps);
          } else {
            rejectLoading(new Error('Google Maps not available after loading'));
          }
        }, 100);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        rejectLoading(new Error('Failed to load Google Maps API - check API key and permissions'));
      };

      console.log('Loading Google Maps from:', script.src);
      console.log('Script element created:', script);
      
      // Debug network request
      script.addEventListener('loadstart', () => {
        console.log('Google Maps script loading started...');
      });
      
      document.head.appendChild(script);
      console.log('Script appended to document head');
    });

    window.googleMapsLoading.then(resolve).catch(reject);
  });
};