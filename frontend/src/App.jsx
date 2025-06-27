import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TechnicianApp from './pages/TechnicianApp';
import CustomerTracking from './pages/CustomerTracking';
import MapTest from './pages/MapTest';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  // Listen for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const newIsAuth = authService.isAuthenticated();
      const newUser = authService.getCurrentUser();
      console.log('Auth check:', { newIsAuth, newUser, currentRole: newUser?.role });
      setIsAuthenticated(newIsAuth);
      setCurrentUser(newUser);
    };

    // Check auth status on mount and when localStorage changes
    checkAuth();
    
    // Listen for storage changes (when token is added/removed)
    window.addEventListener('storage', checkAuth);
    
    // Listen for custom auth change events
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  console.log('App render:', { isAuthenticated, currentUser: currentUser?.role });

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/track/:trackingCode" element={<CustomerTracking />} />
        <Route path="/map-test" element={<MapTest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && currentUser?.role === 'dispatcher' ? 
            <Dashboard /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/tech" 
          element={
            isAuthenticated && (currentUser?.role === 'technician' || currentUser?.role === 'dispatcher') ? 
            <TechnicianApp /> : 
            <Navigate to="/login" replace />
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={
                isAuthenticated ? 
                (currentUser?.role === 'dispatcher' ? '/dashboard' : '/tech') : 
                '/login'
              } 
              replace 
            />
          } 
        />
      </Routes>
    </div>
  );
}

export default App;