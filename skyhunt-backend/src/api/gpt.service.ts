/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class GptService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async generateChallenge(username: string, airport: string): Promise<string> {
    try {
      const prompt = `Generate a one-sentence creative scavenger hunt challenge for a user named ${username} at ${airport} airport. Do not mention photos. Be fun but realistic.`;

      console.log('[📤 GPT Prompt]:', prompt);
      console.log('[🔑 API Key Present]:', !!process.env.OPENAI_API_KEY);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Switch to 'gpt-3.5-turbo' if needed
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
      });

      const message = response.choices?.[0]?.message?.content;
      console.log('[✅ GPT Response]:', message);

      return message ?? '⚠️ GPT returned no message.';
    } catch (err: any) {
      console.error('[❌ GPT Error Thrown]');

      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', err.response.data);
      } else {
        console.error('Message:', err.message);
      }

      return '⚠️ GPT failed to generate a challenge.';
    }
  }
}
