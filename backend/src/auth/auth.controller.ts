import {Controller, Post, Body, UseGuards, UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {JwtAuthGuard} from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() body: {email: string; password: string}) {
    const user = await this.auth.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    return this.auth.login(user);
  }

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ) {
    return this.auth.register(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh() {
    // TODO: refresh token flow
    return {};
  }
}
