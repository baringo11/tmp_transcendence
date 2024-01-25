//  src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { IntraAuthModule } from "./intra-auth/intra-auth.module";
import { AppGatewayModule } from './app-gateway/appGateway.module';
import { ChatModule } from './chat/chat.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { GameModule } from './game/game.module';
import { TwoFactorAuthenticationModule } from './two-factor-authentication/two-factor-authentication.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env" }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "database",
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: ["dist/**/*.entity{.ts,.js}"],
      synchronize: true,
      retryDelay: 3000,
      retryAttempts: 10,
    }),
	  ScheduleModule.forRoot(),
    IntraAuthModule,
    UsersModule,
    AuthModule,
    AppGatewayModule,
    ChatModule,
    FileUploadModule,
    GameModule,
    TwoFactorAuthenticationModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
