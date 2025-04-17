import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // Load environment variables
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend requests (allow all for dev)
  app.enableCors({
    origin: '*', // In production, replace with your frontend domain
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running at http://localhost:${port}`);
}

bootstrap();
