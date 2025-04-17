import { Module } from '@nestjs/common';
import { GptService } from './api/gpt.service';
import { GptController } from './api/gpt.controller';
import { PhotoController } from './api/photo.controller';

@Module({
  imports: [],
  controllers: [GptController, PhotoController],
  providers: [GptService],
})
export class AppModule {}
