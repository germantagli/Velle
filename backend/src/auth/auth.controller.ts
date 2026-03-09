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
  async login(@Body() body: {email?: string; contact?: string; password: string}) {
    const contact = body.contact || body.email || '';
    const user = await this.auth.validateUser(contact, body.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const tokenData = await this.auth.login(user);
    const profile = await this.auth.getProfile(user.id);
    return {
      ...tokenData,
      user: profile,
    };
  }

  @Post('send-otp')
  async sendOtp(
    @Body() body: {contact: string; purpose: 'REGISTER' | 'LOGIN'},
  ) {
    return this.auth.sendOtp(body.contact, body.purpose);
  }

  @Post('verify-otp-login')
  async verifyOtpLogin(
    @Body() body: {contact: string; code: string},
  ) {
    return this.auth.verifyOtpLogin(body.contact, body.code);
  }

  @Post('verify-otp-register')
  async verifyOtpRegister(
    @Body() body: {contact: string; code: string},
  ) {
    return this.auth.verifyOtpRegister(body.contact, body.code);
  }

  @Post('register')
  async register(
    @Body()
    body: {
      contact: string;
      email?: string;
      phone?: string;
      password: string;
      firstName: string;
      lastName: string;
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
  @Post('mfa/disable')
  async disableMfa(
    @CurrentUser() user: {id: string},
    @Body() body: {code: string},
  ) {
    return this.auth.disableMfa(user.id, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: {id: string},
    @Body() body: {currentPassword: string; newPassword: string},
  ) {
    return this.auth.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: {email: string}) {
    return this.auth.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: {email: string; code: string; newPassword: string},
  ) {
    return this.auth.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh() {
    return {};
  }
}
