// src/main.ts
import { NestFactory } from '@nestjs/core';
import { PlatformModule } from './hindeara-platform/platform/platform.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { PhonemesService } from './apps/alfa-app/phonemes/phonemes.service';
import { UsersService } from './hindeara-platform/users/users.service';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// Load environment variables from .env before any other logic
dotenv.config();

function ensureGoogleCredentials() {
  const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  if (!b64) return;
  const target = path.join('/tmp', 'google-cloud-key.json');
  try {
    const buf = Buffer.from(b64, 'base64');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf, { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = target;
  } catch (e) {
    process.stderr.write(String(e instanceof Error ? e.message : e));
  }
}

async function bootstrap() {
  ensureGoogleCredentials();
  const app = await NestFactory.create(PlatformModule);

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();

  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://www.deep-connect.app',
      'https://deep-connect.app',
    ],
  });
  const config = new DocumentBuilder()
    .setTitle('Hindeara API')
    .setDescription('API docs')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const phonemesService = app.get(PhonemesService);
  await phonemesService.seedEnglishAlphabet();
  await phonemesService.seedHindiAlphabet();

  const usersService = app.get(UsersService);
  await usersService.create({ phoneNumber: '+911234567890' });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
