import { useState } from 'react';
import { authService } from '../services/auth';

export default function SimpleCreateTechnician({ onTechnicianCreated, companyId, onCancel }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    pin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const newTechnician = await authService.createTechnician({
        companyId,
        ...formData
      });
      onTechnicianCreated(newTechnician.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create technician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add New Technician</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          type="text"
          name="firstName"
          placeholder="First Name *"
          value={formData.firstName}
          onChange={handleInputChange}
          required
        />
        <input
          className="border p-2 rounded"
          type="text"
          name="lastName"
          placeholder="Last Name *"
          value={formData.lastName}
          onChange={handleInputChange}
          required
        />
        <input
          className="border p-2 rounded"
          type="tel"
          name="phone"
          placeholder="Phone Number *"
          value={formData.phone}
          onChange={handleInputChange}
          required
        />
        <input
          className="border p-2 rounded"
          type="email"
          name="email"
          placeholder="Email (Optional)"
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          className="border p-2 rounded"
          type="password"
          name="pin"
          placeholder="PIN *"
          value={formData.pin}
          onChange={handleInputChange}
          required
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors flex-1"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Add Technician'}
          </button>
        </div>
      </form>
    </section>
  );
}