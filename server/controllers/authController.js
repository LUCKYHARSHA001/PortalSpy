import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Filter from '../models/Filter.js';
import { addWhatsappJob } from '../queues/queueManager.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'portalspy_super_secret_jwt_key_2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, getJwtSecret(), { expiresIn: '7d' });
};

// E.164 international standard phone validation regex (+ followed by 8 to 15 digits)
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${phone}`;
};

export const register = async (req, res) => {
  try {
    let { email, password, whatsappNumber } = req.body;

    if (!email || !password || !whatsappNumber) {
      return res.status(400).json({ message: 'Email, password, and WhatsApp phone number are required.' });
    }

    whatsappNumber = normalizePhone(whatsappNumber);

    if (!E164_REGEX.test(whatsappNumber)) {
      return res.status(400).json({ 
        message: 'Invalid WhatsApp phone number format. Please enter a valid 10-digit mobile number.' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      whatsappNumber,
      isVerified: true,
      authProvider: 'local'
    });

    // Create default filter settings for user
    await Filter.create({
      userId: user._id,
      includeTerms: ['React', 'Frontend', 'Software Engineer', 'Fullstack'],
      excludeTerms: ['Senior Lead', 'Director'],
      locations: ['Remote', 'India', 'Hybrid']
    });

    // Queue Welcome / Linked Confirmation WhatsApp Notification
    if (user.whatsappNumber) {
      addWhatsappJob({
        userPhone: user.whatsappNumber,
        isWelcome: true,
        company: 'Portalspy Engine',
        title: 'Notifications Activated',
        location: 'Onboarding',
        applyUrl: 'http://localhost:5173'
      }).catch(e => console.warn('Welcome WhatsApp notification dispatch warn:', e.message));
    }

    const token = generateToken(user._id, user.email);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || '',
        avatar: user.avatar || '',
        whatsappNumber: user.whatsappNumber,
        isVerified: user.isVerified,
        authProvider: user.authProvider || 'local'
      }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
    }

    const token = generateToken(user._id, user.email);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || '',
        avatar: user.avatar || '',
        whatsappNumber: user.whatsappNumber,
        isVerified: user.isVerified,
        authProvider: user.authProvider || 'local'
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken, credential, accessToken, isDemo, demoUser } = req.body;

    let email, googleId, name, avatar;

    if (accessToken) {
      // Fetch user info using Google OAuth2 userinfo API endpoint
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        return res.status(401).json({ message: 'Invalid or expired Google access token.' });
      }

      const payload = await response.json();
      email = payload.email;
      googleId = payload.sub;
      name = payload.name || payload.given_name || '';
      avatar = payload.picture || '';
    } else if (isDemo) {
      email = demoUser?.email || 'demo.google@portalspy.io';
      googleId = demoUser?.googleId || 'demo_google_id_123456789';
      name = demoUser?.name || 'Google Demo User';
      avatar = demoUser?.avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    } else {
      const token = idToken || credential;
      if (!token) {
        return res.status(400).json({ message: 'Google authentication token is required.' });
      }

      let payload;
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
          });
          payload = ticket.getPayload();
        } else {
          // Fallback verification via Google tokeninfo public API
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
          if (!response.ok) throw new Error('Token verification failed');
          payload = await response.json();
        }
      } catch (verifyErr) {
        console.error('Google token verification error:', verifyErr);
        return res.status(401).json({ message: 'Invalid or expired Google token.' });
      }

      email = payload.email;
      googleId = payload.sub;
      name = payload.name || payload.given_name || '';
      avatar = payload.picture || '';
    }

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google authentication.' });
    }

    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (name && !user.name) user.name = name;
      if (avatar && !user.avatar) user.avatar = avatar;
      if (!user.authProvider) user.authProvider = 'google';
      await user.save();
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        googleId,
        name,
        avatar,
        authProvider: 'google',
        isVerified: true,
        whatsappNumber: ''
      });

      // Create default filter settings for user
      await Filter.create({
        userId: user._id,
        includeTerms: ['React', 'Frontend', 'Software Engineer', 'Fullstack'],
        excludeTerms: ['Senior Lead', 'Director'],
        locations: ['Remote', 'India', 'Hybrid']
      });
    }

    const token = generateToken(user._id, user.email);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || name || '',
        avatar: user.avatar || avatar || '',
        whatsappNumber: user.whatsappNumber || '',
        isVerified: user.isVerified,
        authProvider: user.authProvider || 'google'
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ message: 'Server error during Google authentication.' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

export const updateWhatsapp = async (req, res) => {
  try {
    let { whatsappNumber } = req.body;

    // Support Unlinking / Clearing Phone Number
    if (whatsappNumber === '' || whatsappNumber === null) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { whatsappNumber: '', isVerified: false },
        { new: true }
      ).select('-passwordHash');

      return res.json({ message: 'WhatsApp phone number unlinked successfully.', user });
    }

    whatsappNumber = normalizePhone(whatsappNumber);

    if (!whatsappNumber || !E164_REGEX.test(whatsappNumber)) {
      return res.status(400).json({
        message: 'Invalid phone format. Please enter a valid 10-digit mobile number.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { whatsappNumber, isVerified: true },
      { new: true }
    ).select('-passwordHash');

    // Automatically queue Welcome / Linked Confirmation WhatsApp Notification
    addWhatsappJob({
      userPhone: user.whatsappNumber,
      isWelcome: true,
      company: 'Portalspy Engine',
      title: 'Notifications Activated',
      location: 'System Onboarding',
      applyUrl: 'http://localhost:5173'
    }).catch(e => console.warn('Welcome WhatsApp notification dispatch warn:', e.message));

    res.json({ message: 'WhatsApp phone number updated successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating phone number.' });
  }
};
