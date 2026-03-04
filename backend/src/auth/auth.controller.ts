import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {JwtAuthGuard} from './jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() body: {email: string; password: string}) {
    const user = await this.auth.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const tokenData = await this.auth.login(user);
    const profile = await this.auth.getProfile(user.id);
    return {
      ...tokenData,
      user: profile,
    };
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
  @Get('me')
  async me(@CurrentUser() user: {id: string}) {
    return this.auth.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/setup')
  async setupMfa(@CurrentUser() user: {id: string}) {
    return this.auth.setupMfa(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  async verifyMfa(
    @CurrentUser() user: {id: string},
    @Body() body: {code: string},
  ) {
    return this.auth.verifyMfa(user.id, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  async enableMfa(
    @CurrentUser() user: {id: string},
    @Body() body: {code: string},
  ) {
    return this.auth.enableMfa(user.id, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh() {
    return {};
  }
}
