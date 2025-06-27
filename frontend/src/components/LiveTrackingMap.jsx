import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

export default function LiveTrackingMap({ 
  customerAddress, 
  technicianLocation, 
  jobStatus,
  onETAUpdate,
  className = "h-96 w-full rounded-lg" 
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [customerMarker, setCustomerMarker] = useState(null);
  const [technicianMarker, setTechnicianMarker] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [trafficLayer, setTrafficLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [trailPolyline, setTrailPolyline] = useState(null);
  const initializationRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 50; // Max 5 seconds of retries

  // Initialize Google Maps with traffic layer
  useEffect(() => {
    console.log('useEffect running, initialization attempted:', initializationRef.current);
    
    if (initializationRef.current) {
      console.log('Skipping initialization - already attempted');
      return;
    }

    initializationRef.current = true;

    const initializeMap = async () => {
      try {
        console.log('Starting to load Google Maps...');
        
        // Wait for the DOM element to be ready
        if (!mapRef.current) {
          retryCountRef.current++;
          if (retryCountRef.current > maxRetries) {
            console.error('Map container never became available after maximum retries');
            setLoadError('Map container initialization failed');
            setIsLoading(false);
            return;
          }
          console.log(`Map container not ready, waiting... (attempt ${retryCountRef.current}/${maxRetries})`);
          setTimeout(initializeMap, 100);
          return;
        }
        
        console.log('Map ref current:', mapRef.current);
        
        const googleMaps = await loadGoogleMaps();
        console.log('Google Maps loaded successfully');
        console.log('Google Maps object:', googleMaps);

        console.log('Creating map instance...');
        
        // Clear any existing content to prevent React/Google Maps conflicts
        mapRef.current.innerHTML = '';
        
        // Start with a neutral center, will be updated when customer address is geocoded
        const neutralCenter = { lat: 0, lng: 0 }; // Will be updated by geocoding
        console.log('LiveTrackingMap starting with neutral center, will update based on customer address');
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 2, // Start zoomed out, will zoom in when address is found
          center: neutralCenter,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        });

        // Add traffic layer
        const traffic = new window.google.maps.TrafficLayer();
        traffic.setMap(mapInstance);

        const directionsServiceInstance = new window.google.maps.DirectionsService();
        const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setTrafficLayer(traffic);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error.message);
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      retryCountRef.current = 0;
      initializationRef.current = false;
    };
  }, []); // Empty dependency array to run only once

  // Update customer location marker
  useEffect(() => {
    if (!map || !customerAddress || !window.google) return;

    console.log('Geocoding customer address:', customerAddress);
    const geocoder = new window.google.maps.Geocoder();
    // Add region bias to prefer US results
    const geocodeRequest = {
      address: customerAddress,
      region: 'us', // Bias toward US results
      componentRestrictions: {
        country: 'US' // Restrict to US only
      }
    };
    
    console.log('Geocoding request:', geocodeRequest);
    
    geocoder.geocode(geocodeRequest, (results, status) => {
      console.log('Geocoding status:', status);
      console.log('Geocoding results count:', results?.length);
      
      if (results && results.length > 0) {
        console.log('All geocoding results:');
        results.forEach((result, index) => {
          console.log(`${index + 1}. ${result.formatted_address} (${result.geometry.location.toString()})`);
        });
      }
      
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        console.log('Using result:', results[0].formatted_address);
        console.log('Coordinates:', location.toString());
        
        // Remove existing customer marker
        if (customerMarker) {
          customerMarker.setMap(null);
        }

        // Create custom customer marker
        const marker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: 'Customer Location',
          icon: {
            url: createCustomMarkerIcon('🏠', '#EF4444'),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          },
          zIndex: 1000
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: sans-serif;">
              <strong>Customer Location</strong><br>
              ${customerAddress}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        setCustomerMarker(marker);
        
        // Always center map on customer location when first geocoded
        // This ensures the map shows the correct geographic area
        map.setCenter(location);
        map.setZoom(15);
        console.log('Map centered on customer location:', location.toString());
      }
    });
  }, [map, customerAddress]);

  // Memoize technician location to prevent constant re-renders
  const stableTechnicianLocation = useMemo(() => {
    console.log('🔧 Processing technician location in memo:', technicianLocation);
    if (!technicianLocation) {
      console.log('❌ No technician location data');
      return null;
    }
    const stable = {
      lat: technicianLocation.lat,
      lng: technicianLocation.lng,
      timestamp: technicianLocation.timestamp,
      speed: technicianLocation.speed || 0,
      accuracy: technicianLocation.accuracy || 0
    };
    console.log('✅ Stable technician location created:', stable);
    return stable;
  }, [technicianLocation?.lat, technicianLocation?.lng, technicianLocation?.timestamp]);

  // Update technician location and route
  useEffect(() => {
    console.log('🚗 Technician marker useEffect triggered:', {
      map: !!map,
      stableTechnicianLocation,
      hasGoogle: !!window.google,
      customerMarker: !!customerMarker
    });
    
    if (!map || !stableTechnicianLocation || !window.google) {
      console.log('❌ Cannot create technician marker - missing requirements');
      return;
    }

    // Wait for customer marker to be created first (ensures map is properly positioned)
    if (!customerMarker) {
      console.log('⏳ Waiting for customer marker before creating technician marker');
      return;
    }

    console.log('✅ Creating technician marker with data:', stableTechnicianLocation);

    console.log('🗺️ Creating LatLng with coordinates:', {
      lat: stableTechnicianLocation.lat,
      lng: stableTechnicianLocation.lng,
      type: typeof stableTechnicianLocation.lat,
      latValid: !isNaN(stableTechnicianLocation.lat),
      lngValid: !isNaN(stableTechnicianLocation.lng)
    });

    const techLocation = new window.google.maps.LatLng(
      stableTechnicianLocation.lat, 
      stableTechnicianLocation.lng
    );
    
    // Debug: Calculate distance between customer and technician
    if (customerMarker) {
      const customerPos = customerMarker.getPosition();
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        techLocation,
        customerPos
      );
      console.log('📏 Distance between customer and technician:', Math.round(distance), 'meters');
      console.log('📍 Customer coordinates:', customerPos.toString());
      console.log('📍 Technician coordinates:', techLocation.toString());
      
      if (distance > 1000) {
        console.log('⚠️ WARNING: Technician appears to be more than 1km from customer!');
        console.log('💡 This suggests GPS data might be outdated or inaccurate');
      }
    }

    console.log('📍 Google Maps LatLng object created:', techLocation.toString());
    console.log('📍 LatLng lat():', techLocation.lat(), 'lng():', techLocation.lng());

    // Add to location history for trail
    setLocationHistory(prev => {
      const newHistory = [...prev, stableTechnicianLocation];
      // Keep only last 50 positions
      const trimmedHistory = newHistory.slice(-50);
      
      // Update trail polyline
      updateTrailPolyline(trimmedHistory);
      
      return trimmedHistory;
    });

    // Remove existing technician marker
    if (technicianMarker) {
      technicianMarker.setMap(null);
    }

    // Create animated technician marker
    console.log('🎯 Creating Google Maps marker at position:', techLocation.toString());
    
    const marker = new window.google.maps.Marker({
      position: techLocation,
      map: map,
      title: 'Technician Location',
      icon: {
        url: createCustomMarkerIcon('🚗', '#10B981'),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      },
      zIndex: 2000,
      animation: window.google.maps.Animation.DROP
    });

    console.log('✅ Technician marker created successfully:', marker);
    console.log('🗺️ Map center when marker created:', map.getCenter().toString());
    console.log('🗺️ Map zoom when marker created:', map.getZoom());
    
    // Check if bounds are available
    const bounds = map.getBounds();
    if (bounds) {
      console.log('🗺️ Map bounds when marker created:', bounds.toString());
    } else {
      console.log('🗺️ Map bounds not yet available');
    }

    // Add enhanced technician info window
    const speed = stableTechnicianLocation.speed || 0;
    const speedKmh = (speed * 3.6).toFixed(1); // Convert m/s to km/h
    const lastUpdate = new Date(stableTechnicianLocation.timestamp).toLocaleTimeString();
    const confidence = stableTechnicianLocation.confidence || 'medium';
    const drivingScore = stableTechnicianLocation.drivingScore || 100;
    const isMoving = stableTechnicianLocation.isMoving || speed > 1;

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; font-family: sans-serif; min-width: 200px;">
          <div style="font-weight: bold; color: #10B981; margin-bottom: 8px;">
            🚗 Technician ${isMoving ? '(Moving)' : '(Stationary)'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div><strong>Speed:</strong><br>${speedKmh} km/h</div>
            <div><strong>Score:</strong><br>${drivingScore}/100</div>
          </div>
          <div style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 8px;">
            GPS: ${confidence} accuracy<br>
            Updated: ${lastUpdate}<br>
            Status: ${jobStatus.replace('_', ' ')}
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    setTechnicianMarker(marker);

    // Always fit both markers in view when technician marker is created
    if (customerMarker) {
      console.log('📍 Fitting both markers in map bounds');
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(customerMarker.getPosition());
      map.fitBounds(bounds);
      
      // Set a good zoom level for local area viewing
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) map.setZoom(15); // Zoom out a bit more to see both markers
        console.log('🔍 Map zoom set to:', map.getZoom());
        window.google.maps.event.removeListener(listener);
      });
    }

    // Calculate and display route if customer location exists and technician is active
    if (customerMarker && directionsService && directionsRenderer && 
        ['assigned', 'en_route', 'arrived'].includes(jobStatus)) {
      
      calculateRoute(techLocation, customerMarker.getPosition());
    }
  }, [map, stableTechnicianLocation, customerMarker, jobStatus]);

  // Calculate route with traffic consideration
  const calculateRoute = (origin, destination) => {
    if (!directionsService || !directionsRenderer) return;

    const request = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS
      },
      avoidHighways: false,
      avoidTolls: false
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        
        // Extract route information
        const route = result.routes[0];
        const leg = route.legs[0];
        
        const routeData = {
          distance: leg.distance.text,
          duration: leg.duration.text,
          durationInTraffic: leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration.text,
          durationValue: leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value,
          startAddress: leg.start_address,
          endAddress: leg.end_address
        };
        
        setRouteInfo(routeData);
        
        // Notify parent component of ETA update
        if (onETAUpdate) {
          const etaMinutes = Math.ceil(routeData.durationValue / 60);
          onETAUpdate({
            eta: etaMinutes,
            distance: leg.distance.value,
            duration: routeData.durationInTraffic,
            trafficDelay: leg.duration_in_traffic ? 
              (leg.duration_in_traffic.value - leg.duration.value) / 60 : 0
          });
        }
        
        // Fit bounds to show entire route
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds);
        
        // Ensure minimum zoom
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom() > 16) map.setZoom(16);
          window.google.maps.event.removeListener(listener);
        });
      } else {
        console.error('Directions request failed:', status);
      }
    });
  };

  // Update trail polyline (Uber-style location history)
  const updateTrailPolyline = (history) => {
    if (!map || !window.google) return;
    
    // Remove existing trail
    if (trailPolyline) {
      trailPolyline.setMap(null);
    }
    
    // Create new trail if we have enough points
    if (history.length > 1) {
      const path = history.map(point => ({
        lat: point.lat,
        lng: point.lng
      }));
      
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#10B981',
        strokeOpacity: 0.6,
        strokeWeight: 4,
        map: map,
        zIndex: 1
      });
      
      setTrailPolyline(polyline);
    }
  };

  // Create custom marker icon
  const createCustomMarkerIcon = (emoji, color) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 40;
    canvas.height = 40;

    // Draw circle background
    context.beginPath();
    context.arc(20, 20, 18, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 3;
    context.stroke();

    // Draw emoji
    context.font = '20px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(emoji, 20, 20);

    return canvas.toDataURL();
  };

  return (
    <div className={className}>
      <div className="h-full w-full relative">
        {/* Google Maps container - React should not manage its children */}
        <div ref={mapRef} className="h-full w-full bg-gray-200" />
        
        {/* Overlay elements outside of map container */}
        {/* Show loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading live tracking...</p>
            </div>
          </div>
        )}

        {/* Show error state but still allow testing */}
        {loadError && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-20">
            <div className="text-center">
              <p className="text-red-600 text-sm mb-2">Map unavailable</p>
              <p className="text-gray-500 text-xs">{loadError}</p>
              {technicianLocation && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-left">
                  <p className="text-sm font-medium text-blue-900">GPS Tracking Active!</p>
                  <p className="text-xs text-blue-700">
                    Lat: {technicianLocation.lat.toFixed(6)}<br/>
                    Lng: {technicianLocation.lng.toFixed(6)}<br/>
                    Updated: {new Date(technicianLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map overlays - only show when loaded successfully */}
        {!isLoading && !loadError && (
          <>
            {/* Route info overlay */}
            {routeInfo && (
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Route Info</div>
                  <div className="text-gray-600">
                    Distance: <span className="font-medium">{routeInfo.distance}</span>
                  </div>
                  <div className="text-gray-600">
                    ETA: <span className="font-medium text-blue-600">{routeInfo.durationInTraffic}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Live indicator */}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium z-10 flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              LIVE
            </div>
          </>
        )}
      </div>
    </div>
  );
}