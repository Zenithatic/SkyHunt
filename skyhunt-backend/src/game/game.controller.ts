import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DBService } from './services/db.service';
import { GptService } from './services/gpt.service';
import { PassportRequest } from 'src/interfaces/PassportRequest';
import { CredentialGuard } from './guards/credential.guard';
import { UserData } from 'src/interfaces/UserData';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: DBService, private readonly gptService: GptService) {}

  @Get('getprompt')
  @UseGuards(CredentialGuard)
  async getPrompt(@Req() req: PassportRequest) {    
    const userData: UserData | undefined = await this.gameService.getUser(req.user);
    
    if (!userData) {
      return { status: 404, message: 'User not found' };
    }

    return { status: 200, message: userData.prompt };
  }

  @Get('makeprompt')
  @UseGuards(CredentialGuard)
  async makePrompt(@Req() req: PassportRequest) {
    const userData: UserData | undefined = await this.gameService.getUser(req.user);
    
    if (!userData) {
      return { status: 404, message: 'User not found' };
    }

    // make sure 30 seconds have passed since the last prompt was generated
    if (Date.now() - userData.updated < 30 * 1000) {
      return { status: 429, message: 'Please wait 30 sec before generating a new prompt' };
    }

    const prompt = await this.gptService.generateChallenge(req.user);

    if (!prompt) {
      return { status: 500, message: 'Failed to generate prompt' };
    }

    await this.gameService.updatePrompt(userData, prompt);

    return { status: 200, message: prompt };
  }
}
