import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { generalConfigSetup } from './generalConfigSetup';

async function bootstrap() {
  const logger = new Logger('main-service');

  process.title = 'main-service';

  const app = await NestFactory.create(AppModule);

  generalConfigSetup(app, {
    serviceName: 'main-service',
    prefix: 'api/v1',
    version: '1',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(` Application is running on: http://localhost:${port}`);
  logger.log(
    `Swagger Documentation available on: http://localhost:${port}/api/v1/docs`,
  );
}
bootstrap();
