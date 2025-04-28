import { Controller, Get, Post, Req, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DBService } from './services/db.service';
import { GptService } from './services/gpt.service';
import { PassportRequest } from 'src/interfaces/PassportRequest';
import { CredentialGuard } from './guards/credential.guard';
import { UserData } from 'src/interfaces/UserData';
import sharp from 'sharp';

@ApiTags('Game') // Group all endpoints under the "Game" tag
@ApiBearerAuth() // Add Bearer token authentication for all endpoints
@Controller('game')
export class GameController {
  constructor(private readonly dbService: DBService, private readonly gptService: GptService) {}

  /**
   * Retrieves the current prompt for the authenticated user.
   * 
   * @param req - The request object containing the authenticated user's data.
   * @returns An object containing the status code and the user's current prompt.
   */
  @Get('getprompt')
  @UseGuards(CredentialGuard)
  @ApiOperation({ summary: 'Retrieve the current prompt for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Prompt retrieved successfully', schema: { example: { statusCode: 200, message: 'Your current prompt' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPrompt(@Req() req: PassportRequest) {
    const userData: UserData | undefined = await this.dbService.getUser(req.user);

    if (!userData) {
      return { statusCode: 404, message: 'User not found' };
    }

    return { statusCode: 200, message: userData.prompt };
  }

  /**
   * Generates a new prompt for the authenticated user.
   * Ensures that at least 20 seconds have passed since the last prompt was generated.
   * 
   * @param req - The request object containing the authenticated user's data.
   * @returns An object containing the status code and the newly generated prompt.
   */
  @Get('makeprompt')
  @UseGuards(CredentialGuard)
  @ApiOperation({ summary: 'Generate a new prompt for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Prompt generated successfully', schema: { example: { statusCode: 200, message: 'Newly generated prompt' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests. Please wait before generating a new prompt.' })
  @ApiResponse({ status: 500, description: 'Failed to generate prompt' })
  async makePrompt(@Req() req: PassportRequest) {
    const userData: UserData | undefined = await this.dbService.getUser(req.user);

    if (!userData) {
      return { statusCode: 404, message: 'User not found' };
    }

    if (Date.now() - userData.updated < 20 * 1000) {
      return { statusCode: 429, message: 'Please wait 20 sec before generating a new prompt' };
    }

    const prompt = await this.gptService.generateChallenge(req.user);

    if (!prompt) {
      return { statusCode: 500, message: 'Failed to generate prompt' };
    }

    await this.dbService.updatePrompt(userData, prompt);

    return { statusCode: 200, message: prompt };
  }

  /**
   * Retrieves the current points for the authenticated user.
   * 
   * @param req - The request object containing the authenticated user's data.
   * @returns An object containing the status code and the user's current points.
   */
  @Get('getpoints')
  @UseGuards(CredentialGuard)
  @ApiOperation({ summary: 'Retrieve the current points for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Points retrieved successfully', schema: { example: { statusCode: 200, message: 100 } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPoints(@Req() req: PassportRequest) {
    const userData: UserData | undefined = await this.dbService.getUser(req.user);

    if (!userData) {
      return { statusCode: 404, message: 'User not found' };
    }

    return { statusCode: 200, message: userData.points };
  }

  /**
   * Submits a photo for validation against the user's current prompt.
   * The photo is resized and encoded in base64 format before being sent to the GPT service.
   * 
   * @param req - The request object containing the authenticated user's data.
   * @param photo - The base64-encoded photo string to be validated.
   * @returns An object containing the status code and the validation result.
   */
  @Post('submitphoto')
  @UseGuards(CredentialGuard)
  @ApiOperation({ summary: 'Submit a photo for validation against the current prompt' })
  @ApiResponse({ status: 200, description: 'Photo validated successfully', schema: { example: { statusCode: 200, message: 'valid', totalpoints: 150 } } })
  @ApiResponse({ status: 400, description: 'Photo is required or prompt expired' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Failed to validate photo' })
  async submitPhoto(@Req() req: PassportRequest, @Body('photo') photo: string) {
    if (!photo) {
      return { statusCode: 400, message: 'Photo is required' };
    }

    const buffer = Buffer.from(photo, 'base64');

    const resizedBuffer = await sharp(buffer)
      .resize({ width: 1280, height: 720, fit: 'inside' })
      .toFormat('jpeg', { quality: 75 })
      .toBuffer();

    const resizedBase64 = resizedBuffer.toString('base64');

    const userData = await this.dbService.getUser(req.user);
    if (!userData) {
      return { statusCode: 404, message: 'User not found' };
    }

    const prompt = userData.prompt;
    if (!prompt || prompt.length === 0) {
      return { statusCode: 400, message: 'No active prompt found for the user' };
    }

    if (Date.now() - userData.updated >= 10 * 60 * 1000) {
      return { statusCode: 400, message: 'Prompt expired. Please generate a new one.' };
    }

    try {
      const pointsEarned = await this.gptService.validatePhoto(req.user, resizedBase64, prompt, userData.updated);

      if (pointsEarned == 0) {
        return { statusCode: 200, message: 'invalid' };
      } else if (pointsEarned == -1) {
        return { statusCode: 500, message: 'Failed to validate photo (server error)' };
      } else {
        await this.dbService.addPoints(req.user, pointsEarned);
        return { statusCode: 200, message: 'valid', totalpoints: pointsEarned + userData.points };
      }
    } catch (error) {
      console.error('Error validating photo with ChatGPT:', error);
      return { statusCode: 500, message: 'Failed to validate photo (server error)' };
    }
  }
}