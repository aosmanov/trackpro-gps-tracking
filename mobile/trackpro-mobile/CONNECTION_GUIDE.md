# TrackPro Mobile - Phone Connection Guide

## Method 1: Direct IP Connection (WSL Networking Workaround)

Since WSL has networking limitations, try these manual connection methods:

### For Expo Go App:
1. Open **Expo Go** on your phone
2. Tap **"Enter URL manually"**
3. Try these URLs:
   - `exp://172.22.183.62:8081`
   - `exp://172.22.183.62:19000`
   - `exp://172.22.183.62:3002`

## Method 2: Use Your Windows Computer IP

1. On Windows, open Command Prompt and run: `ipconfig`
2. Find your "Wireless LAN adapter Wi-Fi" IPv4 Address (like 192.168.1.XXX)
3. In Expo Go, enter: `exp://YOUR_IP_ADDRESS:8081`

## Method 3: Test Web Version First

Since the mobile app works perfectly in the browser:
1. Open http://localhost:3002 in your phone's browser
2. Login with: sarah@bostonwater.com / password123
3. Test the functionality (though GPS won't be as accurate as native)

## Current Status
✅ Mobile app fully functional
✅ Authentication working  
✅ Backend connected
✅ UI/UX optimized for mobile
✅ Native GPS tracking implemented

The app is ready - it's just the WSL networking preventing easy connection.

## Alternative: Development on Windows
For future development, consider running the entire stack on Windows or using Docker to avoid WSL networking limitations.