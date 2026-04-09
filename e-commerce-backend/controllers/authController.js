const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_MS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000), 10); // 7 days

function generateAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'default_access_secret', {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  };
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    // Allow only specific roles and normalize to lowercase
    const allowedRoles = ['user', 'admin'];
    let normalizedRole = 'user';
    if (role && typeof role === 'string') {
      const r = role.toLowerCase();
      if (allowedRoles.includes(r)) normalizedRole = r;
    }

    const user = new User({ name, email, password, role: normalizedRole });
    await user.save();

    // create tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await user.addRefreshToken(refreshToken);

    // set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, cookieOptions());

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: accessToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await user.addRefreshToken(refreshToken);

    res.cookie('refreshToken', refreshToken, cookieOptions());

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: accessToken });
  } catch (err) {
    next(err);
  }
};

// Rotate refresh token and return new access token
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 'refreshTokens.token': hashed });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    // rotate
    await user.removeRefreshToken(token);
    const newRefresh = generateRefreshToken();
    await user.addRefreshToken(newRefresh);

    const accessToken = generateAccessToken(user);
    res.cookie('refreshToken', newRefresh, cookieOptions());
    res.json({ token: accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token) {
      const hashed = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({ 'refreshTokens.token': hashed });
      if (user) await user.removeRefreshToken(token);
    }
    res.clearCookie('refreshToken', cookieOptions());
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
