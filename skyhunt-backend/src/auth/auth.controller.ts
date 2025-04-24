import { Controller, Get, UseGuards, Req, Res, Post } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleUser } from '../interfaces/GoogleUser';
import { PassportRequest } from '../interfaces/PassportRequest';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Initiates Google authentication.
   * This endpoint redirects the user to Google's OAuth 2.0 consent screen.
   * Upon successful authentication, a cookie is automatically set with the JWT token.
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiate Google Authentication Process
  }

  /**
   * Handles the Google authentication callback.
   * This endpoint processes the user's authentication data after they have
   * successfully logged in with Google.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: PassportRequest, @Res() res: Response) {
    const user: GoogleUser = {
      username: req!.user!.username!,
      id: req.user.id,
      image: req.user.image,
    };

    await this.authService.logGoogleLogin(user);

    await this.authService.addUser(user);

    const token = await this.authService.generateJwt(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: process.env.PRODUCTION === 'true' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }

  /**
   * Logs the user out by clearing the authentication cookie.
   * This endpoint removes the `access_token` cookie from the user's browser,
   * effectively logging them out of the application.
   */
  @Get('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: process.env.PRODUCTION === 'true' ? 'none' : 'lax',
      path: '/'
    });

    return res.status(200).json({ status: 200, message: 'Logout successful' });
  }

  /**
   * Retrieves the user's data from the JWT token.
   * This endpoint verifies the JWT token and returns the user's information.
   */
  @Get('getdata')
  async getData(@Req() req: PassportRequest) {
    const token = req.cookies['access_token'];

    if (!token) {
      return { status: 401, message: 'No token provided' };
    }

    try {
      const user = await this.authService.verifyJwt(token);
      return user;
    } catch (error) {
      return { status: 401, message: 'Invalid Token' };
    }
  }
}
