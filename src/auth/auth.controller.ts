import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  SignUpDto,
  AuthResponseDto,
  SignInDto,
  TokenResponseDto,
  ResendOtpBodyDto,
  VerifyUserBodyDto,
} from './dto';
import { AuthService } from './auth.service';
import { Swagger, swaggerConfig } from 'src/libs/swagger';
import {
  AuthenticatedRequest,
  GoogleRequest,
  SuccessResponseType,
} from 'src/common/types';
import { Response, Request } from 'express';
import { mergeClasses } from 'src/common/utils';
import { REFRESH_TOKEN } from 'src/common/constants';
import { JwtAuthGuard } from './guards';
import { GoogleAuthGuard } from './guards/google.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    swaggerConfig.addTag('Auth');
  }
  @Post('sign-up')
  @Swagger({
    summary: 'Sign up',
    description: 'Sign up with email and password',
    response: AuthResponseDto,
    successCode: HttpStatus.CREATED,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async signUp(
    @Body() payload: SignUpDto,
  ): Promise<SuccessResponseType<AuthResponseDto>> {
    return this.authService.signUp(payload);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Sign in',
    description: 'Sign in with email and password',
    response: mergeClasses(AuthResponseDto, TokenResponseDto),
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async signIn(
    @Body() payload: SignInDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<SuccessResponseType<AuthResponseDto & TokenResponseDto>> {
    return this.authService.signIn(payload, req, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Swagger({
    summary: 'Get current user',
    description: 'Get current user',
    withAuth: true,
    response: AuthResponseDto,
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.UNAUTHORIZED, HttpStatus.BAD_REQUEST],
  })
  async me(
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponseType<AuthResponseDto>> {
    return this.authService.me(req);
  }

  @Get('refresh-token')
  @Swagger({
    summary: 'Refresh token',
    description: 'Refresh token',
    response: TokenResponseDto,
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponseType<TokenResponseDto>> {
    return this.authService.refreshToken(req.cookies[REFRESH_TOKEN], req, res);
  }

  @Get('sign-out')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Swagger({
    summary: 'Sign out',
    description: 'Sign out',
    withAuth: true,
    successExample: { message: 'Success', data: {} },
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.UNAUTHORIZED],
  })
  async signOut(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; data: {} }> {
    return this.authService.signOut(req, res);
  }

  @Get('google-auth')
  @UseGuards(GoogleAuthGuard)
  @Swagger({
    summary: 'Google login',
    description: 'Google login',
  })
  @Get('google-auth/redirect')
  @UseGuards(GoogleAuthGuard)
  @Swagger({
    summary: 'Google login redirect',
    description: 'Google login redirect',
  })
  async googleAuthRedirect(
    @Req() req: GoogleRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponseType<AuthResponseDto & TokenResponseDto>> {
    return this.authService.googleAuthRedirect(req, res);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Resend OTP',
    description: 'Resend OTP',
    successExample: { message: 'Success', data: {} },
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async resendOtp(
    @Body() payload: ResendOtpBodyDto,
  ): Promise<SuccessResponseType<{}>> {
    return this.authService.resendOtp(payload);
  }

  @Post('verify-user')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Verify user',
    description: 'Verify user',
    successExample: { message: 'Success', data: {} },
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async verifyUser(
    @Body() payload: VerifyUserBodyDto,
  ): Promise<SuccessResponseType<{}>> {
    return this.authService.verifyUser(payload);
  }
}
