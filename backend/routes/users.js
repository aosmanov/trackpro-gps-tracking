const express = require('express');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireRole, requireCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all technicians for a company
router.get('/company/:companyId/technicians', requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const { data: technicians, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        is_active,
        created_at,
        technician_profiles (
          photo_url,
          is_verified,
          years_experience,
          specialties
        )
      `)
      .eq('company_id', companyId)
      .eq('role', 'technician')
      .order('first_name');

    if (error) {
      console.error('Technicians fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch technicians' });
    }

    res.json(technicians);
  } catch (error) {
    console.error('Technicians fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get technician profile
router.get('/technician/:technicianId/profile', async (req, res) => {
  try {
    const { technicianId } = req.params;

    // Check if requesting user has access
    if (req.user.role === 'technician' && req.user.id !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: technician, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        is_active,
        technician_profiles (
          *
        )
      `)
      .eq('id', technicianId)
      .eq('company_id', req.user.company_id)
      .eq('role', 'technician')
      .single();

    if (error || !technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json(technician);
  } catch (error) {
    console.error('Technician profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update technician profile
router.put('/technician/:technicianId/profile', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const {
      photoUrl,
      videoIntroUrl,
      licenseNumber,
      licenseType,
      licenseExpiry,
      certifications,
      yearsExperience,
      specialties,
      bio
    } = req.body;

    // Check if requesting user has access
    if (req.user.role === 'technician' && req.user.id !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify technician belongs to same company
    const { data: technician } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', technicianId)
      .eq('company_id', req.user.company_id)
      .eq('role', 'technician')
      .single();

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Update technician profile
    const { data: profile, error } = await supabaseAdmin
      .from('technician_profiles')
      .update({
        photo_url: photoUrl,
        video_intro_url: videoIntroUrl,
        license_number: licenseNumber,
        license_type: licenseType,
        license_expiry: licenseExpiry,
        certifications: certifications,
        years_experience: yearsExperience,
        specialties: specialties,
        bio: bio
      })
      .eq('technician_id', technicianId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change technician PIN
router.put('/technician/:technicianId/change-pin', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { currentPin, newPin } = req.body;

    // Only allow technician to change their own PIN
    if (req.user.id !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required' });
    }

    // Get current user
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', technicianId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, user.password_hash);
    if (!isValidPin) {
      return res.status(400).json({ error: 'Current PIN is incorrect' });
    }

    // Hash new PIN
    const saltRounds = 10;
    const newPinHash = await bcrypt.hash(newPin, saltRounds);

    // Update PIN
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newPinHash })
      .eq('id', technicianId);

    if (updateError) {
      console.error('PIN update error:', updateError);
      return res.status(500).json({ error: 'Failed to update PIN' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('PIN change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;