import { Controller, Post, Body } from '@nestjs/common';
import { GptService } from './gpt.service';

@Controller('gpt')
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('generate-challenge')
  async getChallenge(@Body() body: { username: string; airport: string }) {
    const { username, airport } = body;

    console.log('[📥 POST Body]:', body);

    const challenge = await this.gptService.generateChallenge(
      username,
      airport,
    );

    console.log('[📤 Returning Challenge]:', challenge);

    return { challenge };
  }
}
