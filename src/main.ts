import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const PORT = process.env.PORT; // ✅ Read AFTER ConfigModule loads env vars
  await app.listen(PORT!, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
bootstrap();
