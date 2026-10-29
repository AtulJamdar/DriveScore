import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // CORS enable karne ke liye yeh line add ki hai
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
