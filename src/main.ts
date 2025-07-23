// src/main.ts
import { NestFactory } from '@nestjs/core';
import { PlatformModule } from './hindeara-platform/platform/platform.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { PhonemesService } from './apps/alfa-app/phonemes/phonemes.service';
import { UsersService } from './hindeara-platform/users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(PlatformModule);

  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));

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

  // Seeding
  const phonemesService = app.get(PhonemesService);
  await phonemesService.seedEnglishAlphabet();
  await phonemesService.seedHindiAlphabet();

  const usersService = app.get(UsersService);
  await usersService.create({});

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
