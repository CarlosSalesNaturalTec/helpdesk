import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-development-jwt-key-change-in-production';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  unidadeId: number;
  sectorId?: number | null;
  mustChangePassword: boolean;
  nome: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
