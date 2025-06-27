const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// Generate JWT token
const generateToken = (userId, companyId) => {
  return jwt.sign(
    { userId, companyId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Dispatcher login (email + password)
router.post('/login/dispatcher', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

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
      .eq('email', email.toLowerCase())
      .eq('role', 'dispatcher')
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.company_id);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Technician login (phone + PIN)
router.post('/login/technician', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Phone number and PIN are required' });
    }

    // Normalize phone number (remove spaces, dashes, parentheses)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

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
      .eq('phone', phone)
      .eq('role', 'technician')
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify PIN (for simplicity, PIN is stored as password_hash)
    const isValidPin = await bcrypt.compare(pin, user.password_hash);
    if (!isValidPin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.company_id);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new company and dispatcher
router.post('/register', async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      dispatcherFirstName,
      dispatcherLastName,
      dispatcherEmail,
      dispatcherPassword
    } = req.body;

    // Validate required fields
    if (!companyName || !companyEmail || !dispatcherFirstName || !dispatcherLastName || !dispatcherEmail || !dispatcherPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if company email already exists
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('email', companyEmail.toLowerCase())
      .single();

    if (existingCompany) {
      return res.status(400).json({ error: 'Company email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dispatcherPassword, saltRounds);

    // Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        email: companyEmail.toLowerCase(),
        phone: companyPhone
      })
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return res.status(500).json({ error: 'Failed to create company' });
    }

    // Create dispatcher user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: company.id,
        email: dispatcherEmail.toLowerCase(),
        password_hash: passwordHash,
        first_name: dispatcherFirstName,
        last_name: dispatcherLastName,
        role: 'dispatcher'
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Clean up company if user creation fails
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create default company branding
    await supabaseAdmin
      .from('company_branding')
      .insert({
        company_id: company.id
      });

    // Generate token
    const token = generateToken(user.id, company.id);

    res.status(201).json({
      token,
      user: {
        ...user,
        companies: company
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create technician account
router.post('/create-technician', async (req, res) => {
  try {
    const {
      companyId,
      firstName,
      lastName,
      phone,
      pin,
      email
    } = req.body;

    // Validate required fields
    if (!companyId || !firstName || !lastName || !phone || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify company exists
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (!company) {
      return res.status(400).json({ error: 'Invalid company' });
    }

    // Check if phone already exists for this company
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .eq('company_id', companyId)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered for this company' });
    }

    // Hash PIN (store as password_hash)
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    // Create technician user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: companyId,
        email: email?.toLowerCase(),
        phone: phone,
        password_hash: pinHash,
        first_name: firstName,
        last_name: lastName,
        role: 'technician'
      })
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .single();

    if (userError) {
      console.error('Technician creation error:', userError);
      return res.status(500).json({ error: 'Failed to create technician' });
    }

    // Create default technician profile
    await supabaseAdmin
      .from('technician_profiles')
      .insert({
        technician_id: user.id
      });

    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Technician creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;