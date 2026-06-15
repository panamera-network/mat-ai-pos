// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(pin: string) {
    const staff = await this.staffService.findByPin(pin);

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    return this.generateToken(staff);
  }

  async loginWithEmail(email: string, password: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { email },
    });

    if (!staff || !staff.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Use bcrypt.compare in production
    if (staff.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(staff);
  }

  private generateToken(staff: any) {
    const payload = { sub: staff.id, name: staff.name, role: staff.role };

    return {
      access_token: this.jwtService.sign(payload),
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        employmentType: staff.employmentType,
        email: staff.email,
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