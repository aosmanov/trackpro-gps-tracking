const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// Middleware to authenticate socket connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', decoded.userId)
      .single();
      
    console.log('WebSocket auth - Looking for user ID:', decoded.userId);
    console.log('WebSocket auth - User found:', user ? `${user.first_name} ${user.last_name}` : 'NOT FOUND');
    console.log('WebSocket auth - Error:', error?.message);

    if (error || !user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.userRole = user.role;
    socket.companyId = user.company_id;
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

module.exports = { authenticateSocket };