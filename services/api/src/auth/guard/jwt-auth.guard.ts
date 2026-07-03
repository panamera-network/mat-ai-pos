// services/api/src/auth/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../jwt-secret';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, getJwtSecret());
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
