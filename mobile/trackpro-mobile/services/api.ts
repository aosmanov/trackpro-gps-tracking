import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// GitHub Codespaces URL (update this after creating Codespace)
// const API_BASE_URL = 'https://YOUR-CODESPACE-NAME-3001.app.github.dev/api';

// Local development URLs
const API_BASE_URL = Platform.select({
  web: 'http://localhost:3001/api',
  default: 'https://YOUR-CODESPACE-NAME-3001.app.github.dev/api', // Will be updated after Codespace creation
});
// This will be updated to your actual Codespace URL after creation

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.baseURL}${endpoint}`;

      console.log('🌐 API Request:', {
        url,
        method: options.method || 'GET',
        headers,
        body: options.body,
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        return {
          data: undefined,
          error: data.error || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        error: undefined,
        status: response.status,
      };
    } catch (error) {
      console.log('❌ Request error:', error);
      return {
        data: undefined,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse> {
    // Use dispatcher login endpoint for email/password authentication
    return this.request('/auth/login/dispatcher', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async technicianLogin(phone: string, pin: string): Promise<ApiResponse> {
    console.log('🔧 technicianLogin called with:', { phone, pin });
    // Use technician login endpoint for phone/PIN authentication
    const result = await this.request('/auth/login/technician', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    });
    console.log('🔧 technicianLogin result:', result);
    return result;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  // Jobs
  async getTechnicianJobs(technicianId: string): Promise<ApiResponse> {
    return this.request(`/jobs/technician/${technicianId}`);
  }

  async updateJobStatus(jobId: string, status: string, notes?: string): Promise<ApiResponse> {
    return this.request(`/jobs/${jobId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async updateJobLocation(jobId: string, locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }): Promise<ApiResponse> {
    return this.request(`/jobs/${jobId}/location`, {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  // Customer tracking
  async getJobByTrackingCode(trackingCode: string): Promise<ApiResponse> {
    return this.request(`/jobs/track/${trackingCode}`);
  }
}

export const apiService = new ApiService();
export default apiService;