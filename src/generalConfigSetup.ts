
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';


interface AppOptions {
  serviceName: string;
  prefix?: string;
  version?: string;
}
export const generalConfigSetup = (
  app: INestApplication,
  options: AppOptions,
) => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
const log = new Logger("app-setup")
  const prefix = options.prefix ?? 'api/v1';
  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.setGlobalPrefix(prefix);

  const config = new DocumentBuilder()
    .setTitle('MedQueue API')
    .setDescription('Hospital Appointment & Queue Management Platform Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
