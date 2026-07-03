import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_PERMISSIONS } from '@mat-ai/types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(pin: string) {
    if (!pin) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const staff = await this.staffService.findByPin(pin);

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    return this.generateToken(staff);
  }

  async loginWithEmail(email: string, password: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { email, isActive: true },
      include: { role: true },
    });

    if (!staff || !staff.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, staff.password);
    const legacyPlainTextMatch = !staff.password.startsWith('$2') && staff.password === password;

    if (!passwordMatches && !legacyPlainTextMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (legacyPlainTextMatch) {
      await this.prisma.staff.update({
        where: { id: staff.id },
        data: { password: await bcrypt.hash(password, 10) },
      });
    }

    return this.generateToken(staff);
  }

  private generateToken(staff: any) {
    const permissions = staff.isSuperAdmin
      ? Object.fromEntries(DEFAULT_PERMISSIONS.map(p => [p.key, true]))
      : (staff.role?.permissions as Record<string, boolean> || {});

    const payload = {
      sub: staff.id,
      name: staff.name,
      roleId: staff.roleId,
      roleName: staff.role?.name,
      isSuperAdmin: staff.isSuperAdmin,
      permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        roleId: staff.roleId,
        roleName: staff.role?.name,
        isSuperAdmin: staff.isSuperAdmin,
        permissions,
      },
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
