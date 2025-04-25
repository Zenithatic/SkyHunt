import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { DBService } from './services/db.service';
import { GptService } from './services/gpt.service';

@Module({
  controllers: [GameController],
  providers: [DBService, GptService]
})
export class GameModule {}
