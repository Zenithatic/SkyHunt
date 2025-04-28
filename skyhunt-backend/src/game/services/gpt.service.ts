import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleUser } from 'src/interfaces/GoogleUser';

@Injectable()
export class GptService {
  private readonly openai: OpenAI;
  private readonly text_model: string;
  private readonly image_model: string;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.text_model = 'gpt-4o-mini'; 
    this.image_model = 'gpt-4o'; 
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
        model: this.text_model, 
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

  /**
   * Validates a photo submitted by a user in a scavenger hunt game.
   * 
   * This function uses OpenAI's API to determine if the submitted photo matches the prompt provided to the user.
   * Points are awarded based on the time elapsed since the prompt was generated, with a maximum of 600 points.
   * 
   * @param {GoogleUser} user - The Google user object containing user details.
   * @param {string} photo - The URL of the photo submitted by the user.
   * @param {string} prompt - The prompt describing the item the user was supposed to find.
   * @param {number} genDate - The timestamp (in milliseconds) when the prompt was generated.
   * 
   * @returns {Promise<number>} A promise that resolves to the number of points earned:
   * - A positive number (up to 600) if the photo is valid and matches the prompt.
   * - 0 if the photo does not match the prompt, or too much time has passed.
   * - -1 if an error occurs during validation.
   * 
   * @throws Logs errors if the OpenAI API call fails.
   * 
   * @example
   * const points = await validatePhoto(user, 'https://example.com/photo.jpg', 'a red apple', Date.now());
   * console.log(points); // Outputs points based on validation and time elapsed.
   */
  async validatePhoto(user: GoogleUser, photo: string, prompt: string, genDate: number): Promise<number> {
    const points = Math.max(0, Math.floor(600 - (Date.now() - genDate) / 1000)); // 1 point off for every second, up to 600 points
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.image_model, 
        messages: [
          { 
            role: 'user', 
            content: [ 
              {type: 'text', text: `You are a judge in a scavenger hunt game. The user has submitted a photo of an item which was meant to be "${ prompt }". Please validate if the photo matches the prompt and return "true" or "false", in all lowercase.`},
              {type: 'image_url', image_url: {url: photo} },
            ]
          }
        ],
        max_tokens: 10,
        temperature: 0, 
      });

      const message = response.choices?.[0]?.message?.content;
      const isValid = message?.toLowerCase() === 'true';
      const pointsEarned = isValid ? points : 0; 
      return pointsEarned;
    } catch (err) {
      console.error('[❌ GPT Error Thrown]');
      console.log(err);

      return -1; 
    }
  }
}
