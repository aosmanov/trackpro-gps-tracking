import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { jobService } from '../services/jobs';
import { userService } from '../services/users';
import JobList from '../components/JobList';
import SimpleCreateJob from '../components/SimpleCreateJob';
import SimpleCreateTechnician from '../components/SimpleCreateTechnician';
import websocketService from '../services/websocket';

// Sidebar Component
function SidebarContent({ currentUser, jobCounts, activeTab, setActiveTab, onCreateJob, onCreateTechnician, onLogout, setSidebarOpen }) {
  const navigation = [
    { name: 'Dashboard', key: 'all', icon: '🏠', count: jobCounts.all },
    { name: 'Jobs', key: 'pending', icon: '📋', count: jobCounts.pending },
    { name: 'Technicians', key: 'active', icon: '👥', count: jobCounts.active },
  ];

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 ring-1 ring-gray-900/10">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-xl font-bold text-gray-900">TrackPro</h1>
      </div>
      
      {/* Company info */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-900">{currentUser.companies?.name}</h3>
        <p className="text-xs text-gray-600 mt-1">Dispatch Management</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Quick Actions</h3>
        <button
          onClick={() => {
            onCreateJob();
            setSidebarOpen && setSidebarOpen(false);
          }}
          className="w-full flex items-center gap-x-3 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Job
        </button>
        <button
          onClick={() => {
            onCreateTechnician();
            setSidebarOpen && setSidebarOpen(false);
          }}
          className="w-full flex items-center gap-x-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-10.5 3V12M3 8.5v3m0 0v3m0-3h3m-3 0H0" />
          </svg>
          Add Technician
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Jobs</div>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      setActiveTab(item.key);
                      setSidebarOpen && setSidebarOpen(false);
                    }}
                    className={`group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                      activeTab === item.key
                        ? 'bg-gray-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    } transition-colors`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                    <span className={`ml-auto w-9 min-w-max whitespace-nowrap rounded-full px-2.5 py-0.5 text-center text-xs font-medium ring-1 ring-inset ${
                      activeTab === item.key
                        ? 'bg-blue-50 text-blue-600 ring-blue-200'
                        : 'bg-gray-50 text-gray-600 ring-gray-200'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, trend, color }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 text-blue-600',
    yellow: 'from-yellow-50 to-yellow-100 text-yellow-600',
    green: 'from-green-50 to-green-100 text-green-600',
    purple: 'from-purple-50 to-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{trend}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showCreateTechnician, setShowCreateTechnician] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
    
    // Set up WebSocket connection for real-time updates
    const handleLocationUpdate = (data) => {
      // Update location for jobs
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === data.jobId 
            ? { ...job, latest_location: { lat: data.latitude, lng: data.longitude, timestamp: data.timestamp } }
            : job
        )
      );
    };

    const handleStatusUpdate = (data) => {
      // Update job status and details
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === data.jobId 
            ? { ...job, status: data.status, notes: data.notes, updated_at: data.timestamp }
            : job
        )
      );
    };

    // Connect to WebSocket
    websocketService.connect();
    
    // Set up event listeners
    websocketService.on('location-update', handleLocationUpdate);
    websocketService.on('job-status-update', handleStatusUpdate);
    
    return () => {
      websocketService.off('location-update', handleLocationUpdate);
      websocketService.off('job-status-update', handleStatusUpdate);
    };
  }, []);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [jobsData, techniciansData] = await Promise.all([
        jobService.getCompanyJobs(currentUser.company_id),
        userService.getCompanyTechnicians(currentUser.company_id)
      ]);
      setJobs(jobsData);
      setTechnicians(techniciansData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (newJob) => {
    setJobs(prev => [newJob, ...prev]);
    setShowCreateJob(false);
  };

  const handleTechnicianCreated = (newTechnician) => {
    setTechnicians(prev => [...prev, newTechnician]);
    setShowCreateTechnician(false);
  };

  const handleJobUpdated = (updatedJob) => {
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'pending':
        return jobs.filter(job => job.status === 'pending');
      case 'active':
        return jobs.filter(job => ['assigned', 'en_route', 'arrived', 'in_progress'].includes(job.status));
      case 'completed':
        return jobs.filter(job => job.status === 'completed');
      default:
        return jobs;
    }
  };

  const getJobCounts = () => {
    return {
      all: jobs.length,
      pending: jobs.filter(job => job.status === 'pending').length,
      active: jobs.filter(job => ['assigned', 'en_route', 'arrived', 'in_progress'].includes(job.status)).length,
      completed: jobs.filter(job => job.status === 'completed').length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const jobCounts = getJobCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
            <SidebarContent 
              currentUser={currentUser}
              jobCounts={jobCounts}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCreateJob={() => setShowCreateJob(true)}
              onCreateTechnician={() => setShowCreateTechnician(true)}
              onLogout={handleLogout}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar - only show on large screens */}
      {isDesktop && (
        <div className="fixed inset-y-0 flex w-72 flex-col">
        <SidebarContent 
          currentUser={currentUser}
          jobCounts={jobCounts}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onCreateJob={() => setShowCreateJob(true)}
          onCreateTechnician={() => setShowCreateTechnician(true)}
          onLogout={handleLogout}
        />
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navbar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Search bar */}
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <svg
                className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                id="search-field"
                className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search jobs, customers..."
                type="search"
                name="search"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"></div>
              
              {/* User menu */}
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-gray-700">
                  {currentUser.first_name} {currentUser.last_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="py-8 pb-20 lg:pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Dashboard heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activeTab === 'all' ? 'Dashboard' : 
                 activeTab === 'pending' ? 'Pending Jobs' :
                 activeTab === 'active' ? 'Active Jobs' : 'Jobs'}
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                {activeTab === 'all' ? 'Welcome back! Here\'s what\'s happening with your service jobs today.' :
                 activeTab === 'pending' ? 'Jobs waiting to be assigned to technicians.' :
                 activeTab === 'active' ? 'Jobs currently in progress.' : 'Manage your service jobs.'}
              </p>
            </div>

            {/* Job Summary Cards - Only show on main dashboard */}
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard
                  title="Total Jobs"
                  value={jobCounts.all}
                  icon="📊"
                  trend="+12% from last month"
                  color="blue"
                />
                <StatsCard
                  title="Pending"
                  value={jobCounts.pending}
                  icon="⏳"
                  trend="Requires attention"
                  color="yellow"
                />
                <StatsCard
                  title="Active"
                  value={jobCounts.active}
                  icon="🚀"
                  trend="In progress"
                  color="green"
                />
                <StatsCard
                  title="Completed"
                  value={jobCounts.completed}
                  icon="✅"
                  trend="+8% this week"
                  color="purple"
                />
              </div>
            )}

            {/* Jobs List */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'all' ? 'All Jobs' : 
                     activeTab === 'pending' ? 'Pending Jobs' :
                     activeTab === 'active' ? 'Active Jobs' : 'Completed Jobs'}
                  </h2>
                  <div className="flex gap-2">
                    <button className="text-sm text-gray-500 hover:text-gray-700">Export</button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">Filter</button>
                  </div>
                </div>
                <JobList 
                  jobs={getFilteredJobs()} 
                  technicians={technicians}
                  onJobUpdated={handleJobUpdated}
                />
              </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation - only visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          {/* Navigation buttons */}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'all' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg mb-1">🏠</span>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'pending' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg mb-1">📋</span>
            <span>Jobs</span>
          </button>
          
          <button
            onClick={() => setShowCreateJob(true)}
            className="flex flex-col items-center py-2 px-3 rounded-lg text-xs font-medium text-white bg-blue-600"
          >
            <span className="text-lg mb-1">➕</span>
            <span>New Job</span>
          </button>
          
          <button
            onClick={() => setActiveTab('active')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'active' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg mb-1">👥</span>
            <span>Active</span>
          </button>
          
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center py-2 px-3 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            <span className="text-lg mb-1">☰</span>
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Modal for New Job */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <SimpleCreateJob
              onJobCreated={handleJobCreated}
              onCancel={() => setShowCreateJob(false)}
            />
          </div>
        </div>
      )}

      {/* Modal for Add Technician */}
      {showCreateTechnician && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <SimpleCreateTechnician
              onTechnicianCreated={handleTechnicianCreated}
              companyId={currentUser.company_id}
              onCancel={() => setShowCreateTechnician(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}