import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import jwt, { Secret } from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_MS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000), 10); // 7 days

function generateAccessToken(user: any) {
  const secret: Secret = (process.env.JWT_SECRET ?? 'default_access_secret') as Secret;
  return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, secret as any, {
    expiresIn: ACCESS_TOKEN_EXPIRES as any,
  }) as string;
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  } as CookieOptions;
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body as any;
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as any;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await (user as any).comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await (user as any).addRefreshToken(refreshToken);

    res.cookie('refreshToken', refreshToken, cookieOptions());

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: accessToken });
  } catch (err) {
    next(err);
  }
};

// Rotate refresh token and return new access token
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req as any).cookies && (req as any).cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 'refreshTokens.token': hashed });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    // rotate
    await (user as any).removeRefreshToken(token);
    const newRefresh = generateRefreshToken();
    await (user as any).addRefreshToken(newRefresh);

    const accessToken = generateAccessToken(user);
    res.cookie('refreshToken', newRefresh, cookieOptions());
    res.json({ token: accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req as any).cookies && (req as any).cookies.refreshToken;
    if (token) {
      const hashed = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({ 'refreshTokens.token': hashed });
      if (user) await (user as any).removeRefreshToken(token);
    }
    res.clearCookie('refreshToken', cookieOptions());
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Request password reset: generate token, save hashed token and expiry, send email (or return link in dev)
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as any;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // respond success to avoid account enumeration
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    (user as any).resetPasswordToken = hashed;
    (user as any).resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
    const resetUrl = `${frontend}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // If SMTP configured, send a richer HTML email; otherwise log and return link for development
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const html = `...`;

      const text = `Reset your password using this link: ${resetUrl}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: user.email,
        subject: 'Reset your password - E‑Com Analytics',
        text,
        html,
      };

      await transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Password reset link:', resetUrl);
        return res.json({ message: 'Reset link sent', resetUrl });
      }
      return res.json({ message: 'Reset link sent' });
    }

    // Not configured: expose link in response for development/testing and log
    console.log('Password reset link:', resetUrl);
    return res.json({ message: 'Reset link generated'});
  } catch (err) {
    next(err);
  }
};

// Reset the password using token + email
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, email, password } = req.body as any;
    if (!token || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    (user as any).password = password; // will be hashed in pre-save hook
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;
    await user.save();

    // create tokens and log the user in
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await (user as any).addRefreshToken(refreshToken);

    res.cookie('refreshToken', refreshToken, cookieOptions());
    res.json({ message: 'Password reset successful', token: accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// Validate reset token + email (GET) to provide immediate feedback to frontend
export const validateReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, email } = req.query as any;
    if (!token || !email) return res.status(400).json({ message: 'Missing token or email' });
    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    return res.json({ valid: true });
  } catch (err) {
    next(err);
  }
};
