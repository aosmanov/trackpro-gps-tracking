import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'technician' | 'dispatcher' | 'customer';
  phone?: string;
  company_id?: string;
}

class AuthService {
  private user: User | null = null;
  private token: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('user_data'),
      ]);

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiService.login(email, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data?.token && response.data?.user) {
        this.token = response.data.token;
        this.user = response.data.user;

        // Store in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('auth_token', this.token || ''),
          AsyncStorage.setItem('user_data', JSON.stringify(this.user)),
        ]);

        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async logout(): Promise<void> {
    this.user = null;
    this.token = null;
    await apiService.logout();
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.token !== null;
  }

  isTechnician(): boolean {
    return this.user?.role === 'technician';
  }

  isDispatcher(): boolean {
    return this.user?.role === 'dispatcher';
  }

  isCustomer(): boolean {
    return this.user?.role === 'customer';
  }

  async setAuthData(token: string, user: User): Promise<void> {
    this.token = token;
    this.user = user;
    
    // Store in AsyncStorage
    await Promise.all([
      AsyncStorage.setItem('auth_token', token),
      AsyncStorage.setItem('user_data', JSON.stringify(user)),
    ]);
  }
}

export const authService = new AuthService();
export default authService;