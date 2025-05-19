import { NestFactory } from '@nestjs/core';
import { PlatformModule } from './hindeara-platform/platform/platform.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(PlatformModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: 'http://localhost:3000',
  });
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
