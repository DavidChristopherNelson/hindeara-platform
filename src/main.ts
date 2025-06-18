// src/main.ts
import { NestFactory } from '@nestjs/core';
import { PlatformModule } from './hindeara-platform/platform/platform.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(PlatformModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://hindeara-frontend.vercel.app',
      'https://hindeara-platform-production.up.railway.app',
    ],
  });
  const config = new DocumentBuilder()
    .setTitle('Hindeara API')
    .setDescription('API docs')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // at http://localhost:3000/api
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
