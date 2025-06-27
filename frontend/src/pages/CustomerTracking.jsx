import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { jobService } from '../services/jobs';
import LiveTrackingMap from '../components/LiveTrackingMap';
import ConnectionStatus from '../components/ConnectionStatus';
import websocketService from '../services/websocket';

export default function CustomerTracking() {
  const { trackingCode } = useParams();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [etaInfo, setEtaInfo] = useState(null);

  useEffect(() => {
    loadJobData();
    
    // Set up WebSocket connection for real-time updates
    const handleLocationUpdate = (data) => {
      if (data.trackingCode === trackingCode) {
        setJobData(prevData => ({
          ...prevData,
          latest_location: {
            lat: data.latitude,
            lng: data.longitude,
            timestamp: data.timestamp
          }
        }));
      }
    };

    const handleStatusUpdate = (data) => {
      if (data.job?.tracking_code === trackingCode) {
        setJobData(prevData => ({
          ...prevData,
          status: data.status,
          notes: data.notes,
          updated_at: data.timestamp
        }));
      }
    };

    // Connect to WebSocket and join tracking room
    websocketService.connect();
    websocketService.joinTracking(trackingCode);
    
    // Set up event listeners
    websocketService.on('location-update', handleLocationUpdate);
    websocketService.on('job-status-update', handleStatusUpdate);
    
    // Fallback polling (reduced frequency since we have real-time updates)
    const interval = setInterval(loadJobData, 120000); // Update every 2 minutes as fallback
    
    return () => {
      clearInterval(interval);
      websocketService.leaveTracking(trackingCode);
      websocketService.off('location-update', handleLocationUpdate);
      websocketService.off('job-status-update', handleStatusUpdate);
    };
  }, [trackingCode]);

  const loadJobData = async () => {
    try {
      const data = await jobService.getJobByTrackingCode(trackingCode);
      console.log('Customer tracking - Job data loaded:', data);
      console.log('Customer tracking - Latest location:', data.latest_location);
      setJobData(prevData => {
        // Only update if data has actually changed to prevent infinite re-renders
        if (!prevData || JSON.stringify(prevData) !== JSON.stringify(data)) {
          return data;
        }
        return prevData;
      });
      setError('');
    } catch (err) {
      setError('Job not found or tracking code invalid');
      console.error('Error loading job data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Your service request has been received and is being processed.',
      assigned: 'A technician has been assigned to your job.',
      en_route: etaInfo ? 
        `Your technician is on the way! ETA: ${etaInfo.eta} minutes (${etaInfo.duration})` :
        'Your technician is on the way to your location.',
      arrived: 'Your technician has arrived and is at your location.',
      in_progress: 'Work is currently in progress.',
      completed: 'Your service has been completed.',
      cancelled: 'This job has been cancelled.'
    };
    return messages[status] || 'Status update available.';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-gray-600',
      assigned: 'text-blue-600',
      en_route: 'text-yellow-600',
      arrived: 'text-orange-600',
      in_progress: 'text-purple-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Service Tracking</h1>
            <p className="text-gray-600 mt-2">{jobData.companies?.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getStatusColor(jobData.status)}`}>
              {jobData.status.replace('_', ' ').toUpperCase()}
            </div>
            <p className="text-gray-700 text-lg mb-4">
              {getStatusMessage(jobData.status)}
            </p>
            
            {jobData.scheduled_start && (
              <p className="text-gray-600">
                Scheduled: {formatDate(jobData.scheduled_start)}
              </p>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Service Information</h3>
              <p className="text-gray-700 mb-1">
                <strong>Job #:</strong> {jobData.job_number}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Service Type:</strong> {jobData.service_type}
              </p>
              {jobData.description && (
                <p className="text-gray-700 mb-1">
                  <strong>Description:</strong> {jobData.description}
                </p>
              )}
              <p className="text-gray-700">
                <strong>Address:</strong> {jobData.customer_address}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
              <p className="text-gray-700 mb-1">
                <strong>Name:</strong> {jobData.customers?.first_name} {jobData.customers?.last_name}
              </p>
              <p className="text-gray-700">
                <strong>Created:</strong> {formatDate(jobData.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Technician Information */}
        {jobData.users && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Technician</h2>
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl font-semibold">
                  {jobData.users.first_name[0]}{jobData.users.last_name[0]}
                </span>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {jobData.users.first_name} {jobData.users.last_name}
                </p>
                <p className="text-gray-600">{jobData.users.phone}</p>
              </div>
            </div>

            {(jobData.status === 'en_route' || jobData.status === 'arrived') && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href={`tel:${jobData.users.phone}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Call Technician
                </a>
              </div>
            )}
          </div>
        )}

        {/* Live Tracking Map */}
        {['assigned', 'en_route', 'arrived', 'in_progress'].includes(jobData.status) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Live Tracking</h2>
              {etaInfo && (
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">
                    {etaInfo.eta} min
                  </div>
                  <div className="text-sm text-gray-500">ETA</div>
                </div>
              )}
            </div>
            
            <LiveTrackingMap
              customerAddress={jobData.customer_address}
              technicianLocation={(() => {
                const techLocation = jobData.latest_location ? {
                  lat: jobData.latest_location.latitude,
                  lng: jobData.latest_location.longitude,
                  timestamp: jobData.latest_location.timestamp,
                  speed: 0,
                  accuracy: 391
                } : null;
                console.log('📤 Passing technician location to map:', techLocation);
                return techLocation;
              })()}
              jobStatus={jobData.status}
              onETAUpdate={setEtaInfo}
              className="h-96 w-full rounded-lg"
            />
            
            {/* ETA and route information */}
            {etaInfo && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{etaInfo.distance}m</div>
                    <div className="text-xs text-gray-600">Distance</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{etaInfo.duration}</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {etaInfo.trafficDelay > 0 ? `+${Math.ceil(etaInfo.trafficDelay)}min` : 'No delays'}
                    </div>
                    <div className="text-xs text-gray-600">Traffic</div>
                  </div>
                </div>
              </div>
            )}
            
            {jobData.latest_location && (
              <p className="text-sm text-gray-500 mt-2">
                Last update: {formatDate(jobData.latest_location.timestamp)}
              </p>
            )}
          </div>
        )}

        {/* Company Contact */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions or concerns, please don't hesitate to contact us.
          </p>
          
          <div className="flex space-x-4">
            <a
              href={`tel:${jobData.companies?.phone}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Call {jobData.companies?.name}
            </a>
          </div>
        </div>

        {/* Connection status and auto-refresh notice */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex justify-center">
            <ConnectionStatus />
          </div>
          <p className="text-sm text-gray-500">
            Real-time updates enabled. Page refreshes automatically as backup.
          </p>
        </div>
      </div>
    </div>
  );
}