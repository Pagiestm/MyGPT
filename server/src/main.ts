import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import session from 'express-session';
import passport from 'passport';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const cookieName = `ca_sid_${crypto.createHash('sha256').update('mygpt-salt').digest('hex').substring(0, 8)}`;

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'ma-cle-secrete',
      resave: false,
      saveUninitialized: false,
      name: cookieName,
      cookie: {
        maxAge: 3600000, // 1 heure en millisecondes
        secure: process.env.NODE_ENV === 'production', // Utiliser HTTPS en production
        httpOnly: true,
        sameSite: 'lax',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const config = new DocumentBuilder()
    .setTitle('MyGPT API')
    .setDescription('API pour le service MyGPT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
