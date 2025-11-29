import { ConfigService } from "@nestjs/config";
import { MongooseModuleOptions } from "@nestjs/mongoose";
import { Connection } from "mongoose";

export const getDatabaseConfig = (
  configService: ConfigService
): MongooseModuleOptions => {
  const mongoUri = configService.get<string>("mongoUri");
  const nodeEnv = configService.get<string>("nodeEnv");
  const isDevelopment = nodeEnv === "development";

  return {
    uri: mongoUri,
    retryWrites: true,
    w: isDevelopment ? undefined : "majority",
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    connectionFactory: (connection: Connection) => {
      connection.on("error", (error) => {
        console.error("MongoDB connection error:", error.message);
      });

      return connection;
    },
  };
};
