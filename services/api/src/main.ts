import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 MAT.ai Backend running on http://localhost:${port}`);
  console.log(`📡 Socket.IO ready on ws://localhost:${port}`);
}
bootstrap();
