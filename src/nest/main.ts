import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './features/app/app.module';
import { ConfigService } from '@nestjs/config';
import getLogLevels from './utils/get-log-levels';

/**
 * Bootstrap creates and returns a NestJS application.
 * @return {INestApplication} The NestJS application.
 */
export default async function bootstrap(): Promise<INestApplication> {
    const app = await NestFactory.create(AppModule);

    // init config service
    const configService = app.get<ConfigService>(ConfigService);

    // logger middleware depending on node environment
    app.useLogger(getLogLevels(configService.get<string>('NODE_ENV') === 'production'));

    // global validation pipe for class-validator
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    // global class serialization for class-transformer
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    return app;
}