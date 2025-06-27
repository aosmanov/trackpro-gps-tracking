import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

export default function GoogleMap({ 
  customerAddress, 
  technicianLocation, 
  jobStatus, 
  className = "h-96 w-full rounded-lg" 
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [customerMarker, setCustomerMarker] = useState(null);
  const [technicianMarker, setTechnicianMarker] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mapRef.current) return;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: { lat: 42.3601, lng: -71.0589 }, // Default to Boston
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        const directionsServiceInstance = new window.google.maps.DirectionsService();
        const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error.message);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);


  // Geocode customer address and add marker
  useEffect(() => {
    if (!map || !customerAddress || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: customerAddress }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        
        // Remove existing customer marker
        if (customerMarker) {
          customerMarker.setMap(null);
        }

        // Add customer marker
        const marker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: 'Customer Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="16" cy="16" r="4" fill="#FFFFFF"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        });

        setCustomerMarker(marker);
        
        // Center map on customer location if no technician
        if (!technicianLocation) {
          map.setCenter(location);
        }
      }
    });
  }, [map, customerAddress]);

  // Update technician location and draw route
  useEffect(() => {
    if (!map || !technicianLocation || !window.google) return;

    const techLocation = new window.google.maps.LatLng(
      technicianLocation.lat, 
      technicianLocation.lng
    );

    // Remove existing technician marker
    if (technicianMarker) {
      technicianMarker.setMap(null);
    }

    // Add technician marker
    const marker = new window.google.maps.Marker({
      position: techLocation,
      map: map,
      title: 'Technician Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
            <path d="M16 8v8l4 4" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      }
    });

    setTechnicianMarker(marker);

    // Draw route if customer location exists and technician is en route
    if (customerMarker && directionsService && directionsRenderer && 
        ['assigned', 'en_route', 'arrived'].includes(jobStatus)) {
      
      directionsService.route({
        origin: techLocation,
        destination: customerMarker.getPosition(),
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          
          // Fit map to show both markers
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(techLocation);
          bounds.extend(customerMarker.getPosition());
          map.fitBounds(bounds);
        }
      });
    } else if (customerMarker) {
      // Just center between both locations
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(customerMarker.getPosition());
      map.fitBounds(bounds);
    }
  }, [map, technicianLocation, customerMarker, jobStatus]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className={className}>
        <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-sm mb-2">Unable to load map</p>
            <p className="text-gray-500 text-xs">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}