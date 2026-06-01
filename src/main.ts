import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const allowedOrigins = [
    /^https?:\/\/localhost:\d+$/,
    /^https?:\/\/127\.0\.0\.1:\d+$/,
    /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/,
    /^https?:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/,
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(?::\d+)?$/,
    /^https?:\/\/13\.62\.181\.167(?::\d+)?$/,
    /^https?:\/\/(?:www\.)?unipillar\.in(?::\d+)?$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT
    ? Number(process.env.PORT)
    : 3001;

  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();