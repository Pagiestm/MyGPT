import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import passport from 'passport';
import { AppModule } from './app.module';
import { dataSourceOptions } from './database/data-source.options';
import { OriginGuard } from './common/origin.guard';
import { SESSION_COOKIE } from './common/session-cookie';
import { DomainErrorFilter } from './common/domain-error.filter';
import { doubleCsrfProtection } from './common/csrf';

const ONE_HOUR = 3600000;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET est obligatoire en production et doit faire au moins 32 caractères',
    );
  }
  new Logger('bootstrap').warn(
    'SESSION_SECRET absente ou trop courte : secret de développement utilisé',
  );
  return 'secret-de-developpement-uniquement-32c';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new DomainErrorFilter(app.get(HttpAdapterHost)));
  app.useGlobalGuards(new OriginGuard());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(cookieParser());

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        conObject: {
          host: dataSourceOptions.type === 'postgres' ? process.env.DB_HOST : undefined,
          port: Number(process.env.DB_PORT ?? 5432),
          user: process.env.DB_USERNAME,
          password: String(process.env.DB_PASSWORD),
          database: process.env.DB_DATABASE,
        },
        tableName: 'user_sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 900,
      }),
      secret: sessionSecret(),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      name: SESSION_COOKIE,
      cookie: {
        maxAge: ONE_HOUR,
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax',
      },
    }),
  );

  app.use(doubleCsrfProtection);

  app.use(passport.initialize());
  app.use(passport.session());

  const config = new DocumentBuilder()
    .setTitle('MyGPT API')
    .setDescription('API pour le service MyGPT')
    .setVersion('1.0')
    .addCookieAuth(SESSION_COOKIE)
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  app.enableCors({
    origin: (process.env.CLIENT_URL ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
