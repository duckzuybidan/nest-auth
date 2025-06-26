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
import { SignUpDto, UserResponseDto } from './dto';
import { AuthService } from './auth.service';
import { Swagger } from 'src/libs/swagger';
import {
  AuthenticatedRequest,
  GoogleRequest,
  SuccessResponseType,
} from 'src/common/types';
import { SignInDto } from './dto/sign-in.dto';
import { Response, Request } from 'express';
import { TokenResponseDto } from './dto/token-response.dto';
import { mergeClasses } from 'src/common/utils';
import { REFRESH_TOKEN } from 'src/common/constants';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards';
import { GoogleAuthGuard } from './guards/google.guard';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Post('sign-up')
  @Swagger({
    operation: 'Sign up',
    description: 'Sign up with email and password',
    response: UserResponseDto,
    successCode: HttpStatus.CREATED,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async signUp(
    @Body() payload: SignUpDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    return this.authService.signUp(payload);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    operation: 'Sign in',
    description: 'Sign in with email and password',
    response: mergeClasses(UserResponseDto, TokenResponseDto),
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.BAD_REQUEST],
  })
  async signIn(
    @Body() payload: SignInDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<SuccessResponseType<UserResponseDto & TokenResponseDto>> {
    return this.authService.signIn(payload, req, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Swagger({
    operation: 'Get current user',
    description: 'Get current user',
    withAuth: true,
    response: UserResponseDto,
    successCode: HttpStatus.OK,
    errorCodes: [HttpStatus.UNAUTHORIZED],
  })
  async me(
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    return this.authService.me(req);
  }

  @Get('refresh-token')
  @Swagger({
    operation: 'Refresh token',
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
    operation: 'Sign out',
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
    operation: 'Google login',
    description: 'Google login',
  })
  async googleAuth() {}

  @Get('google-auth/redirect')
  @UseGuards(GoogleAuthGuard)
  @Swagger({
    operation: 'Google login redirect',
    description: 'Google login redirect',
  })
  async googleAuthRedirect(
    @Req() req: GoogleRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponseType<UserResponseDto & TokenResponseDto>> {
    return this.authService.googleAuthRedirect(req, res);
  }
}
