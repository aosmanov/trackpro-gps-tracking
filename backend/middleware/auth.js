const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// Middleware to verify JWT tokens
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check company access
const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const companyId = req.params.companyId || req.body.company_id;
  
  if (companyId && req.user.company_id !== companyId) {
    return res.status(403).json({ error: 'Access denied to this company' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireCompanyAccess
};