import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleUser } from 'src/interfaces/GoogleUser';

@Injectable()
export class GptService {
  private readonly openai: OpenAI;
  private readonly model: string;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.model = 'gpt-4o-mini'; 
  }

  /**
   * Generates a creative scavenger hunt challenge for a user at a specific airport.
   * 
   * @param {GoogleUser} user - The Google user object containing user details.
   * @returns {Promise<string>} A promise that resolves to the generated challenge string, or an empty string if an error occurs.
   * 
   * @throws Will log errors if the OpenAI API call fails and return a fallback message.
   */
  async generateChallenge(user: GoogleUser): Promise<string> {
    const prompt = 'Pretend you are responsible with coming up with creative scavenger hunt challenges for a user at an airport. Generate and return only a single item the user should search for and take a picture of at the airport. It should not include people and it should be generic and simple enough such that all people from different airports can play. Only include the item in your response, nothing else. Make sure the prompt is clear and is easily understandable. The image the user takes will be given back to you for validation, so make sure it is something you are capable of visually verifying.';

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model, 
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
      });

      const message = response.choices?.[0]?.message?.content;

      return message ?? '';
    } catch (err) {
      console.error('[❌ GPT Error Thrown]');

      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', err.response.data);
      } else {
        console.error('Message:', err.message);
      }

      return '';
    }
  }
}
