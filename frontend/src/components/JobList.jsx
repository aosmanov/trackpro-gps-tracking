import { useState } from 'react';
import { jobService } from '../services/jobs';

export default function JobList({ jobs, technicians, onJobUpdated }) {
  const [loadingJobs, setLoadingJobs] = useState(new Set());

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      en_route: 'bg-yellow-100 text-yellow-800',
      arrived: 'bg-orange-100 text-orange-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      assigned: 'Assigned',
      en_route: 'En Route',
      arrived: 'Arrived',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const handleAssignTechnician = async (jobId, technicianId) => {
    try {
      setLoadingJobs(prev => new Set(prev).add(jobId));
      const updatedJob = await jobService.assignTechnician(jobId, technicianId);
      onJobUpdated(updatedJob);
    } catch (error) {
      console.error('Error assigning technician:', error);
      alert('Failed to assign technician');
    } finally {
      setLoadingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      setLoadingJobs(prev => new Set(prev).add(jobId));
      const updatedJob = await jobService.updateJobStatus(jobId, newStatus);
      onJobUpdated(updatedJob);
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    } finally {
      setLoadingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const generateTrackingUrl = (trackingCode) => {
    return `${window.location.origin}/track/${trackingCode}`;
  };

  const copyTrackingUrl = (trackingCode) => {
    const url = generateTrackingUrl(trackingCode);
    navigator.clipboard.writeText(url);
    alert('Tracking URL copied to clipboard');
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">No jobs found</p>
        <p className="text-gray-400 text-sm mt-2">Create your first job to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Technician
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id} className={loadingJobs.has(job.id) ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {job.job_number}
                    </div>
                    <div className="text-sm text-gray-500">{job.service_type}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created: {formatDate(job.created_at)}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {job.customers?.first_name} {job.customers?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{job.customers?.phone}</div>
                    <div className="text-xs text-gray-400">{job.customer_address}</div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {job.users ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.users.first_name} {job.users.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{job.users.phone}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not assigned</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col space-y-2">
                    {/* Assign Technician */}
                    {job.status === 'pending' && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignTechnician(job.id, e.target.value);
                          }
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 w-32"
                        disabled={loadingJobs.has(job.id)}
                      >
                        <option value="">Assign Tech</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.first_name} {tech.last_name}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {/* Status Updates */}
                    {job.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'en_route')}
                        className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 w-20"
                        disabled={loadingJobs.has(job.id)}
                      >
                        En Route
                      </button>
                    )}
                    
                    {job.status === 'en_route' && (
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'arrived')}
                        className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 w-20"
                        disabled={loadingJobs.has(job.id)}
                      >
                        Arrived
                      </button>
                    )}
                    
                    {job.status === 'arrived' && (
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'in_progress')}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 w-20"
                        disabled={loadingJobs.has(job.id)}
                      >
                        Start Work
                      </button>
                    )}
                    
                    {job.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'completed')}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 w-20"
                        disabled={loadingJobs.has(job.id)}
                      >
                        Complete
                      </button>
                    )}
                    
                    {/* Tracking URL */}
                    {job.tracking_code && (
                      <button
                        onClick={() => copyTrackingUrl(job.tracking_code)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 w-24"
                      >
                        Copy Link
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}