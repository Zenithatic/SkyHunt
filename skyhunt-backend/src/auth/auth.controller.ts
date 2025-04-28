import { Controller, Get, UseGuards, Req, Res, Post } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleUser } from '../interfaces/GoogleUser';
import { PassportRequest } from '../interfaces/PassportRequest';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth') // Group all endpoints under the "Auth" tag
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
  @ApiOperation({ summary: 'Initiate Google authentication (jwt will be saved as token)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth 2.0 consent screen' })
  async googleAuth() {
    // Initiate Google Authentication Process
  }

  /**
   * Handles the Google authentication callback.
   * This endpoint processes the user's authentication data after they have
   * successfully logged in with Google.
   * 
   * @param req - The request object containing the authenticated user's data.
   * @param res - The response object used to set cookies and redirect the user.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Handle Google authentication callback' })
  @ApiResponse({ status: 302, description: 'Redirects to the frontend after successful authentication' })
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
   * 
   * @param res - The response object used to clear the cookie.
   * @returns A success message indicating the user has been logged out.
   */
  @Get('logout')
  @ApiOperation({ summary: 'Log out the user' })
  @ApiResponse({ status: 200, description: 'Logout successful', schema: { example: { statusCode: 200, message: 'Logout successful' } } })
  async logout(@Res() res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: process.env.PRODUCTION === 'true' ? 'none' : 'lax',
      path: '/'
    });

    return res.status(200).json({ statusCode: 200, message: 'Logout successful' });
  }

  /**
   * Retrieves the user's data from the JWT token.
   * This endpoint verifies the JWT token and returns the user's information.
   * 
   * @param req - The request object containing the JWT token in cookies.
   * @returns The user's data if the token is valid, or an error message if invalid.
   */
  @Get('getdata')
  @ApiOperation({ summary: 'Retrieve user data from JWT token' })
  @ApiResponse({ status: 200, description: 'User data retrieved successfully', schema: { example: { username: 'JohnDoe', id: '12345', image: 'https://example.com/image.jpg' } } })
  @ApiResponse({ status: 401, description: 'No token provided or invalid token', schema: { example: { statusCode: 401, message: 'Invalid Token' } } })
  async getData(@Req() req: PassportRequest) {
    const token = req.cookies['access_token'];

    if (!token) {
      return { statusCode: 401, message: 'No token provided' };
    }

    try {
      const user = await this.authService.verifyJwt(token);
      return user;
    } catch (error) {
      return { statusCode: 401, message: 'Invalid Token' };
    }
  }
}