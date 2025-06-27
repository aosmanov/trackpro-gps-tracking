import { useState, useEffect } from 'react';
import { promptInstall, isAppInstalled } from '../utils/serviceWorker';

export default function PWAInstallButton({ className = "" }) {
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(isAppInstalled());

    // Listen for install prompt availability
    const handleInstallable = () => {
      if (!isAppInstalled()) {
        setShowInstallButton(true);
      }
    };

    // Listen for app installation
    const handleInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error('Error prompting install:', error);
    }
  };

  // Don't show button if app is already installed
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`
        flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
        hover:bg-blue-700 transition-colors text-sm font-medium
        ${className}
      `}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Install App
    </button>
  );
}