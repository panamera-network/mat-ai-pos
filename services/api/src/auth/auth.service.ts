// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class AuthService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
  ) {}

  async login(pin: string) {
    const staff = await this.staffService.findByPin(pin);
    
    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const payload = { sub: staff.id, name: staff.name, role: staff.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        employmentType: staff.employmentType,
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