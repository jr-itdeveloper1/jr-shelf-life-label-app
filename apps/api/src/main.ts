import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const shouldSeedDemoData = process.env.ENABLE_DEMO_SEED !== 'false' && process.env.APP_ENV !== 'production';
  if (shouldSeedDemoData) {
    const seed = app.get(SeedService);
    await seed.ensureSeedData();
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
