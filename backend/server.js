const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { supabase } = require('./config/supabase');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const userRoutes = require('./routes/users');

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);

// Socket.IO authentication middleware
const { authenticateSocket } = require('./utils/socketAuth');
io.use(authenticateSocket);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (User: ${socket.user.first_name} ${socket.user.last_name}, Role: ${socket.userRole})`);
  
  // Join room based on company
  socket.join(`company_${socket.companyId}`);
  
  // Join specific rooms based on role
  if (socket.userRole === 'technician') {
    socket.join(`technician_${socket.userId}`);
  } else if (socket.userRole === 'dispatcher') {
    socket.join(`dispatcher_${socket.userId}`);
  }

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Handle enhanced technician location updates (Uber-style)
  socket.on('location-update', async (data) => {
    try {
      const { 
        jobId, 
        latitude, 
        longitude, 
        accuracy,
        speed,
        heading,
        timestamp,
        drivingScore,
        isMoving,
        confidence
      } = data;
      
      // Verify technician is assigned to this job
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('technician_id', socket.userId)
        .single();

      if (error || !job) {
        socket.emit('error', { message: 'Unauthorized or job not found' });
        return;
      }

      // Update location in database with enhanced data
      const { error: locationError } = await supabase
        .from('job_locations')
        .insert({
          job_id: jobId,
          technician_id: socket.userId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          speed: speed || null,
          heading: heading || null,
          timestamp: timestamp || new Date().toISOString()
        });

      if (!locationError) {
        // Broadcast enhanced location data to company room and specific job tracking
        const locationUpdate = {
          jobId,
          technicianId: socket.userId,
          lat: latitude,
          lng: longitude,
          accuracy,
          speed,
          heading,
          timestamp: timestamp || new Date().toISOString(),
          trackingCode: job.tracking_code,
          drivingScore,
          isMoving,
          confidence
        };

        socket.to(`company_${socket.companyId}`).emit('location-update', locationUpdate);
        socket.to(`job_${jobId}`).emit('location-update', locationUpdate);
        socket.to(`tracking_${job.tracking_code}`).emit('location-update', locationUpdate);
      }
    } catch (error) {
      console.error('Location update error:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle job status updates
  socket.on('job-status-update', async (data) => {
    try {
      const { jobId, status, notes } = data;
      console.log('📡 WebSocket job status update received:', { jobId, status, notes });
      
      // Update job status in database
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ 
          status, 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('company_id', socket.companyId)
        .select('*, customers(*), users(*)')
        .single();

      if (error) {
        socket.emit('error', { message: 'Failed to update job status' });
        return;
      }

      // Broadcast to all relevant parties
      const statusUpdate = {
        jobId,
        status,
        notes,
        job: updatedJob,
        timestamp: new Date().toISOString()
      };

      socket.to(`company_${socket.companyId}`).emit('job-status-update', statusUpdate);
      socket.to(`job_${jobId}`).emit('job-status-update', statusUpdate);
      socket.to(`tracking_${updatedJob.tracking_code}`).emit('job-status-update', statusUpdate);
      
      // Confirm to sender
      socket.emit('job-status-updated', statusUpdate);
    } catch (error) {
      console.error('Job status update error:', error);
      socket.emit('error', { message: 'Failed to update job status' });
    }
  });

  // Handle joining job tracking rooms (for customer tracking page)
  socket.on('join-tracking', (trackingCode) => {
    socket.join(`tracking_${trackingCode}`);
    console.log(`Client ${socket.id} joined tracking room: ${trackingCode}`);
  });

  // Handle leaving job tracking rooms
  socket.on('leave-tracking', (trackingCode) => {
    socket.leave(`tracking_${trackingCode}`);
    console.log(`Client ${socket.id} left tracking room: ${trackingCode}`);
  });
});

// Make io available to other modules
app.set('io', io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
});