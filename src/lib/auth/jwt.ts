import * as jwt from 'jsonwebtoken';
import { User } from '@/types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * JWT Utility Functions
 */
export class JWTService {
  /**
   * Generate JWT token
   */
  static generateToken(user: User, roles: string[] = []): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const exp = (decoded as unknown as { exp: number }).exp;
    if (!exp) return true;

    return Date.now() >= exp * 1000;
  }
}
