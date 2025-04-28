import * as dotenv from 'dotenv';
dotenv.config(); // Load .env first

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { promises as fs } from 'fs';
import { Express } from 'express';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

@Controller('photo')
export class PhotoController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `image-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { username: string; challenge: string },
    
  ) {
    try {
      const imagePath = `./uploads/${file.filename}`;
      console.log('[🧾 File saved at]', imagePath);

      const imageBuffer = await fs.readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64}`;

      // 🧪 Debug logs
      console.log('[🧪 base64 length]', base64.length);
      console.log('[📤 imageUrl preview]', imageUrl.substring(0, 30));

      if (!base64 || base64.length < 1000 || !imageUrl.startsWith('data:image')) {
        console.error('[❌ Malformed base64 image]');
        return { error: 'Base64 image string is invalid or too short' };
      }

      const prompt = `Does this image show: "${body.challenge}"? Respond only with yes or no.`;

      console.log('[🧠 Sending to OpenAI with challenge]', body.challenge);

      const result = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 10,
      });

      const answer = result.choices[0].message.content?.toLowerCase().trim();
      const isMatch = answer?.includes('yes');

      console.log('[✅ GPT Response]', answer);

      return {
        match: isMatch,
        rawAnswer: answer,
      };
    } catch (err) {
      console.error('[❌ Failed to process image with GPT]', err);
      return { error: 'Something went wrong while analyzing the image' };
    }
  }
}
