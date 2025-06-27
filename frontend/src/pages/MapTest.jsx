import { useState } from 'react';
import LiveTrackingMap from '../components/LiveTrackingMap';
import SimpleMap from '../components/SimpleMap';

export default function MapTest() {
  const [etaInfo, setEtaInfo] = useState(null);

  // Test data to ensure the map loads
  const testData = {
    customerAddress: "123 Main Street, Boston, Massachusetts, United States",
    technicianLocation: {
      lat: 42.3601,
      lng: -71.0589,
      timestamp: new Date().toISOString(),
      speed: 25 // km/h
    },
    jobStatus: "en_route"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Google Maps Test</h1>
        
        {/* Test info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Configuration</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Customer Address:</strong> {testData.customerAddress}</p>
            <p><strong>Technician Location:</strong> Lat: {testData.technicianLocation.lat}, Lng: {testData.technicianLocation.lng}</p>
            <p><strong>Job Status:</strong> {testData.jobStatus}</p>
            <p><strong>API Key Present:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Simple Map Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Simple Map Test</h2>
          <SimpleMap className="h-96 w-full rounded-lg border" />
        </div>

        {/* Original Map component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Tracking Map</h2>
          
          <LiveTrackingMap
            customerAddress={testData.customerAddress}
            technicianLocation={testData.technicianLocation}
            jobStatus={testData.jobStatus}
            onETAUpdate={setEtaInfo}
            className="h-96 w-full rounded-lg border"
          />
          
          {/* ETA Display */}
          {etaInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Route Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ETA:</span> {etaInfo.eta} minutes
                </div>
                <div>
                  <span className="font-medium">Distance:</span> {etaInfo.distance}m
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {etaInfo.duration}
                </div>
                <div>
                  <span className="font-medium">Traffic Delay:</span> {Math.ceil(etaInfo.trafficDelay)} min
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="bg-gray-100 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Debug Information</h3>
          <p className="text-sm text-gray-600">
            Check the browser console for detailed loading information and any error messages.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Open Developer Tools (F12) → Console tab to see Google Maps loading progress.
          </p>
        </div>
      </div>
    </div>
  );
}