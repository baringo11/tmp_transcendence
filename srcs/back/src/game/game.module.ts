import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AppGatewayModule } from 'src/app-gateway/appGateway.module';
import { UsersModule } from 'src/users/users.module';

@Module({
	imports: [AppGatewayModule, UsersModule],
  	providers: [GameService, GameGateway],
	exports: []
})
export class GameModule {}
