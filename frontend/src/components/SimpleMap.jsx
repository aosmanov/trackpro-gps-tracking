import { useEffect, useRef, useState } from 'react';

export default function SimpleMap({ className = "h-96 w-full rounded-lg" }) {
  const mapRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    console.log('SimpleMap useEffect running');
    
    const loadMap = async () => {
      try {
        setStatus('Loading Google Maps API...');
        
        // Check if already loaded
        if (window.google && window.google.maps) {
          console.log('Google Maps already loaded');
          createMap();
          return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          setStatus('Google Maps API key missing');
          return;
        }
        
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        
        script.onload = () => {
          console.log('Google Maps script loaded');
          createMap();
        };
        
        script.onerror = () => {
          setStatus('Failed to load Google Maps API');
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('Error loading map:', error);
        setStatus('Error: ' + error.message);
      }
    };

    const createMap = () => {
      if (!mapRef.current) {
        console.log('Map container not ready, retrying...');
        setTimeout(createMap, 100);
        return;
      }

      try {
        setStatus('Creating map...');
        console.log('Creating map instance');
        
        // Use a world view initially - will be centered by address geocoding in real usage
        const centerCoords = { lat: 20, lng: 0 }; // Neutral world center
        console.log('Setting map center to neutral world view');
        
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 2,
          center: centerCoords,
        });
        
        console.log('Map created with world view');

        // Add a test marker at a recognizable location for demo
        const testLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
        new window.google.maps.Marker({
          position: testLocation,
          map: map,
          title: 'Test Location - NYC'
        });
        
        // Center on the test marker
        map.setCenter(testLocation);
        map.setZoom(13);

        setStatus('Map loaded successfully!');
        console.log('Map created successfully');
        
      } catch (error) {
        console.error('Error creating map:', error);
        setStatus('Error creating map: ' + error.message);
      }
    };

    loadMap();
  }, []);

  return (
    <div className={className}>
      <div className="h-full w-full relative bg-gray-100 rounded-lg">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Status overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow p-3 z-10">
          <div className="text-sm font-medium text-gray-900">Status:</div>
          <div className="text-sm text-gray-600">{status}</div>
        </div>
      </div>
    </div>
  );
}