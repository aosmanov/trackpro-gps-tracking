# TrackPro - GPS Tracking System

A complete Uber-style GPS tracking platform for service businesses with real-time technician tracking, job management, and customer notifications.

## Project Structure

```
trackpro/
├── backend/           # Node.js/Express API server
├── frontend/          # React web application (dispatcher dashboard)
├── mobile/           # React Native mobile app (technician & customer)
└── database/         # Database schemas and sample data
```

## Features

### ✅ Completed Features
- **Real-time GPS tracking** with Uber-style live updates
- **Dispatcher dashboard** for job creation and management
- **Technician mobile app** with native GPS tracking
- **Customer tracking page** with live technician location
- **Authentication system** (email/password + phone/PIN)
- **WebSocket real-time updates**
- **Google Maps integration** with ETAs and route optimization
- **Progressive Web App** support
- **React Native mobile apps** with Expo

### 🎯 Mobile App Features
- Native GPS tracking with background location
- Job management interface for technicians
- Real-time location updates (2-second intervals)
- Professional UI following platform guidelines
- Phone call integration
- Automatic job status updates

### 🚀 Tech Stack
- **Backend:** Node.js, Express, Supabase, WebSockets
- **Frontend:** React, Vite, TailwindCSS
- **Mobile:** React Native, Expo, TypeScript
- **Database:** PostgreSQL (Supabase)
- **Maps:** Google Maps API
- **Real-time:** WebSocket.io

## Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Mobile App
```bash
cd mobile/trackpro-mobile
npm install
npx expo start
```

## Deployment

- **Backend:** Railway/Render/Heroku
- **Frontend:** Vercel/Netlify
- **Mobile:** Expo Go (development) / App Store & Google Play (production)

## Business Model

Designed for service businesses needing GPS tracking:
- HVAC companies
- Plumbing services
- Delivery companies
- Field service providers
- Any business with mobile technicians

## Getting Started

1. Clone the repository
2. Set up environment variables (see .env.example)
3. Install dependencies for each component
4. Start development servers
5. Use Expo Go to test mobile app on your phone

Built with ❤️ for modern service businesses.