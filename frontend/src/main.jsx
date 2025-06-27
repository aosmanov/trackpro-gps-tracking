import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { register as registerSW, setupInstallPrompt } from './utils/serviceWorker'

// Register service worker
registerSW({
  onSuccess: (registration) => {
    console.log('PWA installed successfully');
  },
  onUpdate: (registration) => {
    console.log('New PWA content available');
    // Could show a toast notification here
  }
});

// Setup install prompt
setupInstallPrompt();

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
