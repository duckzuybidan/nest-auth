import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig, swaggerOptions } from './libs/swagger';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters';
import { ConfigService } from '@nestjs/config';
import { ErrorResponseType } from './common/types';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const docsPath = configService.get<string>('DOCS_PATH') || 'api/docs';

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const document = SwaggerModule.createDocument(app, swaggerConfig.build());
  SwaggerModule.setup(docsPath, app, document, swaggerOptions);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const errorDetail: Record<string, string[]> = {};

        for (const err of errors) {
          if (err.constraints) {
            errorDetail[err.property] = Object.values(err.constraints);
          }
        }
        throw new BadRequestException({
          message: 'Validation failed',
          errorDetail,
        } satisfies ErrorResponseType);
      },
    }),
  );

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
}

bootstrap();
