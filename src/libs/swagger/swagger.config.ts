import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Swagger')
  .setDescription('Swagger')
  .setVersion('1.0');

export const swaggerOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    withCredentials: true,
  },
};
