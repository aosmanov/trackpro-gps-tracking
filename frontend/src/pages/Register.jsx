import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Register() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    dispatcherFirstName: '',
    dispatcherLastName: '',
    dispatcherEmail: '',
    dispatcherPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Start your TrackPro account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join service businesses improving customer trust with live tracking
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Company Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Boston Water Restoration"
                  />
                </div>
                
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                    Company Email
                  </label>
                  <input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    required
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="info@bostonwater.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                    Company Phone
                  </label>
                  <input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="(617) 555-0100"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dispatcher Account</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="dispatcherFirstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="dispatcherFirstName"
                    name="dispatcherFirstName"
                    type="text"
                    required
                    value={formData.dispatcherFirstName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Sarah"
                  />
                </div>
                
                <div>
                  <label htmlFor="dispatcherLastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="dispatcherLastName"
                    name="dispatcherLastName"
                    type="text"
                    required
                    value={formData.dispatcherLastName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Johnson"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="dispatcherEmail" className="block text-sm font-medium text-gray-700">
                    Your Email
                  </label>
                  <input
                    id="dispatcherEmail"
                    name="dispatcherEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.dispatcherEmail}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="sarah@bostonwater.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="dispatcherPassword" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="dispatcherPassword"
                    name="dispatcherPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.dispatcherPassword}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Create a secure password"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create TrackPro account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}