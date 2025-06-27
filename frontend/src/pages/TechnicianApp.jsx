import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { jobService } from '../services/jobs';
import websocketService from '../services/websocket';
import locationTrackingService from '../services/locationTracking';
import PWAInstallButton from '../components/PWAInstallButton';
import ConnectionStatus from '../components/ConnectionStatus';

export default function TechnicianApp() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingStatus, setTrackingStatus] = useState(null);
  
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadTechnicianJobs();
    
    // Set up WebSocket connection
    websocketService.connect();
    
    // Set up real-time job updates
    const handleStatusUpdate = (data) => {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === data.jobId 
            ? { ...job, status: data.status, notes: data.notes, updated_at: data.timestamp }
            : job
        )
      );
    };

    websocketService.on('job-status-update', handleStatusUpdate);
    
    return () => {
      websocketService.off('job-status-update', handleStatusUpdate);
      // Stop any active tracking when component unmounts
      locationTrackingService.stopTracking();
    };
  }, []);

  // Monitor location tracking status
  useEffect(() => {
    const updateTrackingStatus = () => {
      setTrackingStatus(locationTrackingService.getTrackingStatus());
    };

    // Initial status
    updateTrackingStatus();

    // Update every 5 seconds
    const interval = setInterval(updateTrackingStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadTechnicianJobs = async () => {
    try {
      setLoading(true);
      console.log('Current user object:', currentUser);
      console.log('Loading jobs for technician:', currentUser.id);
      console.log('Auth token:', authService.getToken());
      
      // Temporarily remove status filter for testing
      const jobsData = await jobService.getTechnicianJobs(currentUser.id);
      console.log('Jobs loaded:', jobsData);
      setJobs(jobsData);
      
      // Auto-start location tracking for any jobs that are already "en_route"
      const enRouteJobs = jobsData.filter(job => job.status === 'en_route');
      if (enRouteJobs.length > 0) {
        console.log('🔄 Found en_route jobs, checking if location tracking needs to be started:', enRouteJobs.map(j => j.job_number));
        
        // Check if location tracking is already active
        if (!locationTrackingService.getTrackingStatus().isTracking) {
          const mostRecentJob = enRouteJobs[0]; // Start tracking for the most recent en_route job
          console.log('🚀 Auto-starting location tracking for job:', mostRecentJob.job_number);
          await handleLocationTracking(mostRecentJob.id, 'en_route');
        } else {
          console.log('✅ Location tracking already active');
        }
      }
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error loading technician jobs:', err);
      console.error('Full error object:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      console.log('🔄 Updating job status:', { jobId, newStatus });
      
      // Try WebSocket first, then HTTP fallback
      if (websocketService.isSocketConnected()) {
        console.log('📡 Sending status update via WebSocket');
        websocketService.updateJobStatus(jobId, newStatus);
      } else {
        console.log('🌐 WebSocket not connected, using HTTP API for status update');
        // HTTP fallback for status update
        await jobService.updateJobStatus(jobId, newStatus);
        console.log('✅ Status updated via HTTP API');
      }
      
      // Also update local state immediately for responsiveness
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus, updated_at: new Date().toISOString() } : job
      ));
      
      console.log('✅ Job status updated in UI, now handling location tracking...');
      
      // Handle location tracking based on status
      await handleLocationTracking(jobId, newStatus);
      
    } catch (err) {
      alert('Failed to update job status');
      console.error('Error updating job status:', err);
    }
  };

  // Handle location tracking for different job statuses
  const handleLocationTracking = async (jobId, status) => {
    try {
      console.log('handleLocationTracking called with:', { jobId, status });
      switch (status) {
        case 'en_route':
          // Start continuous GPS tracking
          console.log('Starting location tracking for job:', jobId);
          await locationTrackingService.startTracking(jobId);
          console.log('✅ Location tracking started successfully');
          break;
          
        case 'arrived':
          // Continue tracking but with reduced frequency
          // Location tracking service handles this automatically
          break;
          
        case 'in_progress':
          // Keep tracking active for customer peace of mind
          break;
          
        case 'completed':
        case 'cancelled':
          // Stop location tracking
          locationTrackingService.stopTracking();
          console.log('Stopped location tracking');
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error managing location tracking:', error);
      // Show user-friendly error
      alert(`Location tracking error: ${error.message}`);
    }
  };

  // Create enhanced location tracking status component
  const LocationTrackingStatus = () => {
    if (!trackingStatus?.isTracking) return null;

    const metrics = trackingStatus.drivingMetrics;
    const isMoving = trackingStatus.isMoving;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-green-700 font-medium text-sm">
              Live GPS Tracking Active
            </span>
          </div>
          <div className="text-green-600 text-xs">
            Job #{trackingStatus.jobId}
          </div>
        </div>
        
        {/* Driving metrics display */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">
              {metrics.speed.toFixed(0)}
            </div>
            <div className="text-xs text-green-600">km/h</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">
              {metrics.score || 100}
            </div>
            <div className="text-xs text-green-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">
              {(metrics.totalDistance / 1000).toFixed(1)}
            </div>
            <div className="text-xs text-green-600">km</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-green-600 text-xs">
            {isMoving ? '🚗 Moving' : '⏸️ Stationary'} • Location shared with customers
          </div>
          {metrics.harshBraking > 0 && (
            <div className="text-orange-600 text-xs">
              ⚠️ {metrics.harshBraking} harsh brake{metrics.harshBraking !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    // Stop location tracking
    locationTrackingService.stopTracking();
    // Disconnect WebSocket
    websocketService.disconnect();
    authService.logout();
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      en_route: 'bg-yellow-100 text-yellow-800',
      arrived: 'bg-orange-100 text-orange-800',
      in_progress: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
              <p className="text-sm text-gray-600 truncate">
                {currentUser.first_name} {currentUser.last_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* PWA Install Button */}
          <div className="mt-3">
            <PWAInstallButton className="w-full sm:w-auto" />
          </div>
        </div>
      </header>

      <div className="px-4 py-4 pb-20">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Location Tracking Status */}
        <LocationTrackingStatus />

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Jobs</h3>
            <p className="text-gray-500">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {job.service_type}
                      </h3>
                      <p className="text-sm text-gray-500">{job.job_number}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Customer</h4>
                    <p className="text-gray-900 font-medium">
                      {job.customers?.first_name} {job.customers?.last_name}
                    </p>
                    <p className="text-blue-600 font-medium">{job.customers?.phone}</p>
                    <p className="text-gray-600 text-sm mt-1">{job.customer_address}</p>
                  </div>

                  {job.description && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Description</h4>
                      <p className="text-gray-700 text-sm">{job.description}</p>
                    </div>
                  )}
                </div>

                {/* Mobile-optimized action buttons */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                  {job.status === 'assigned' && (
                    <button
                      onClick={() => handleStatusUpdate(job.id, 'en_route')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white py-3 px-4 rounded-lg text-base font-medium transition-colors touch-manipulation"
                    >
                      🚗 Start Traveling
                    </button>
                  )}
                  
                  {job.status === 'en_route' && (
                    <>
                      {!trackingStatus?.isTracking && (
                        <button
                          onClick={() => handleLocationTracking(job.id, 'en_route')}
                          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg text-base font-medium transition-colors touch-manipulation"
                        >
                          📍 Start Location Tracking
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'arrived')}
                        className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white py-3 px-4 rounded-lg text-base font-medium transition-colors touch-manipulation"
                      >
                        📍 Mark as Arrived
                      </button>
                    </>
                  )}
                  
                  {job.status === 'arrived' && (
                    <button
                      onClick={() => handleStatusUpdate(job.id, 'in_progress')}
                      className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 px-4 rounded-lg text-base font-medium transition-colors touch-manipulation"
                    >
                      🔧 Start Work
                    </button>
                  )}
                  
                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate(job.id, 'completed')}
                      className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg text-base font-medium transition-colors touch-manipulation"
                    >
                      ✅ Complete Job
                    </button>
                  )}

                  <a
                    href={`tel:${job.customers?.phone}`}
                    className="w-full block bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-4 rounded-lg text-base font-medium text-center transition-colors touch-manipulation"
                  >
                    📞 Call Customer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}