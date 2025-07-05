import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// GitHub Codespaces URL
const API_BASE_URL = Platform.select({
  web: 'http://localhost:3001/api',
  default: 'https://probable-umbrella-6v5xpjr675vc5ppp-3001.app.github.dev/api',
});

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
      
      // Get raw response text first to debug
      const responseText = await response.text();
      console.log('📝 Raw response text:', responseText);
      
      let data;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log('📦 Parsed response data:', data);
        } catch (parseError) {
          console.log('❌ JSON parse error:', parseError);
          console.log('📝 Response text was:', responseText);
          return {
            data: undefined,
            error: 'Invalid server response',
            status: response.status,
          };
        }
      } else {
        console.log('⚠️ Empty response body');
        return {
          data: undefined,
          error: 'Empty server response',
          status: response.status,
        };
      }

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
    // Use completely different path to bypass auth
    const url = `${this.baseURL.replace('/api', '')}/test-jobs/${technicianId}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      data,
      error: undefined,
      status: response.status
    };
  }

  async updateJobStatus(jobId: string, status: string, notes?: string): Promise<ApiResponse> {
    // Use test endpoint to bypass auth
    const url = `${this.baseURL.replace('/api', '')}/test-jobs/${jobId}/status`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes }),
    });
    
    const data = await response.json();
    
    return {
      data,
      error: undefined,
      status: response.status
    };
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