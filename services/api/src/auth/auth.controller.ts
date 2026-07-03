// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { pin?: string; email?: string; password?: string }) {
    if (body.email && body.password) {
      return this.authService.loginWithEmail(body.email, body.password);
    }
    return this.authService.login(body.pin);
  }
}
