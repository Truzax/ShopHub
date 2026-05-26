import { Request, Response, NextFunction } from 'express';
import type { CookieOptions } from 'express';
import { AuthService } from '../services/authService';
import { catchAsync } from '../middleware/catchAsync';

const REFRESH_TOKEN_EXPIRES_MS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000), 10);

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  } as CookieOptions;
}

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: string };
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const { user, accessToken, refreshToken } = await AuthService.signup({ name, email, password, role });
    res.cookie('refreshToken', refreshToken, cookieOptions());
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: accessToken,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const { user, accessToken, refreshToken } = await AuthService.login({ email, password });
    res.cookie('refreshToken', refreshToken, cookieOptions());
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: accessToken });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
});

export const refresh = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const { user, accessToken, newRefresh } = await AuthService.refresh(token);
    res.cookie('refreshToken', newRefresh, cookieOptions());
    res.json({ token: accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
});

export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies && req.cookies.refreshToken;
  if (token) {
    await AuthService.logout(token);
  }
  res.clearCookie('refreshToken', cookieOptions());
  res.status(204).end();
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const resetUrl = await AuthService.requestPasswordReset(email);
  if (!resetUrl) {
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  }

  const isDev = process.env.NODE_ENV === 'development';
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (!hasSmtp) {
    if (isDev) {
      console.log('Password reset link:', resetUrl);
      return res.json({ message: 'Reset link generated' });
    }
    return res.json({ message: 'Reset link generated' });
  }

  if (isDev) {
    console.log('Password reset link:', resetUrl);
    return res.json({ message: 'Reset link sent' });
  }
  return res.json({ message: 'Reset link sent' });
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token, email, password } = req.body as { token?: string; email?: string; password?: string };
  if (!token || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const { user, accessToken, refreshToken } = await AuthService.resetPassword({ token, email, password });
    res.cookie('refreshToken', refreshToken, cookieOptions());
    res.json({ message: 'Password reset successful', token: accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
});

export const validateReset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token, email } = req.query as { token?: string; email?: string };
  if (!token || !email) return res.status(400).json({ message: 'Missing token or email' });

  const isValid = await AuthService.validateReset(String(token), String(email));
  if (!isValid) return res.status(400).json({ message: 'Invalid or expired reset token' });

  return res.json({ valid: true });
});
