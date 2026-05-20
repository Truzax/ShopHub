import User from '../models/User';
import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';

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

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: user.email,
        subject: 'Reset your password - E‑Com Analytics',
        text: `Reset your password using this link: ${resetUrl}`,
        html: `...`,
      };

      await transporter.sendMail(mailOptions);
    }
    return resetUrl;
  }

  static async resetPassword(data: any) {
    const { token, email, password } = data;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
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
    const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
    return !!user;
  }
}
