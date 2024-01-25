import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AppGatewayModule } from '../app-gateway/appGateway.module';
import { UsersModule } from 'src/users/users.module';
import { ChatService } from './chat.service';
import { ChannelsService } from './channel.service';

@Module({
	imports: [AppGatewayModule, UsersModule],
	providers: [ChatGateway, ChatService, ChannelsService]
})
export class ChatModule {}
