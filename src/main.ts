import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>("port") || 5000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors();

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);

  try {
    const connection = app.get<Connection>(getConnectionToken());

    if (connection.readyState === 1) {
      console.log("[Database] Connected successfully.");
    } else {
      console.warn(
        `[Database] Connection not established. ReadyState: ${connection.readyState}`
      );
    }
  } catch (error) {
    console.error(
      "[Database] Error while checking connection:",
      error?.message
    );
  }
}

bootstrap();
