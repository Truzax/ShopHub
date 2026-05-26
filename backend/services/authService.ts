import User from '../models/User';
import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export class AuthService {
  static generateAccessToken(user: any) {
    const secret = process.env.JWT_SECRET!;
    return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, secret as Secret, {
      expiresIn: ACCESS_TOKEN_EXPIRES as any,
    }) as string;
  }

  static generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  static async signup(data: any) {
    const { name, email, password, role } = data;
    const existing = await User.findOne({ email });
    if (existing) {
      throw { status: 409, message: 'Email already in use' };
    }

    const allowedRoles = ['user', 'admin'];
    let normalizedRole = 'user';
    if (role && typeof role === 'string') {
      const r = role.toLowerCase();
      if (allowedRoles.includes(r)) normalizedRole = r;
    }

    const user = new User({ name, email, password, role: normalizedRole });
    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    await (user as any).addRefreshToken(refreshToken);

    return { user, accessToken, refreshToken };
  }

  static async login(data: any) {
    const { email, password } = data;
    const user = await User.findOne({ email });
    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const valid = await (user as any).comparePassword(password);
    if (!valid) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    await (user as any).addRefreshToken(refreshToken);

    return { user, accessToken, refreshToken };
  }

  static async refresh(token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 'refreshTokens.token': hashed });
    if (!user) {
      throw { status: 401, message: 'Invalid refresh token' };
    }

    await (user as any).removeRefreshToken(token);
    const newRefresh = this.generateRefreshToken();
    await (user as any).addRefreshToken(newRefresh);

    const accessToken = this.generateAccessToken(user);
    return { user, accessToken, newRefresh };
  }

  static async logout(token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 'refreshTokens.token': hashed });
    if (user) await (user as any).removeRefreshToken(token);
  }

  static async requestPasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    (user as any).resetPasswordToken = hashed;
    (user as any).resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
    const resetUrl = `${frontend}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (hasSmtpConfig()) {
      const transporter = getSmtpTransporter();

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'E-Commerce Analytics <no-reply@example.com>',
        to: user.email,
        subject: 'Reset your password - E-Commerce Analytics',
        text: [
          'We received a request to reset your password.',
          `Reset link: ${resetUrl}`,
          'This link expires in 1 hour.',
          'If you did not request this change, you can ignore this email.',
        ].join('\n\n'),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
            <h2 style="margin-bottom: 12px;">Reset your password</h2>
            <p>We received a request to reset your password.</p>
            <p>
              <a href="${resetUrl}" style="display: inline-block; padding: 10px 14px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    }
    return resetUrl;
  }

  static async resetPassword(data: any) {
    const { token, email, password } = data;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: mongoose.trusted({ $gt: Date.now() }) });
    if (!user) {
      throw { status: 400, message: 'Invalid or expired token' };
    }

    (user as any).password = password;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;
    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    await (user as any).addRefreshToken(refreshToken);

    return { user, accessToken, refreshToken };
  }

  static async validateReset(token: string, email: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: mongoose.trusted({ $gt: Date.now() }) });
    return !!user;
  }
}
