import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { GatewayUser } from '../app-gateway/interfaces/gateway-user.interface';
import { AppGatewayService } from '../app-gateway/appGateway.service';
import { PrivMessagePayload, ChatUser } from './interfaces/chat.interface';


@Injectable()
export class ChatService {

	private users: GatewayUser[] = [];

	constructor(
        @Inject(UsersService)
		private usersService: UsersService,
        @Inject(AppGatewayService)
        private appGatewayService: AppGatewayService,
	) {}

    async chatConnect(gatewayUser: GatewayUser) {
        gatewayUser.socket.broadcast.emit('chatConnect', await this.usersService.findOneById(gatewayUser.id));
    }

    async chatDisconnect(gatewayUser: GatewayUser) {
        gatewayUser.socket.broadcast.emit('chatDisconnect', await this.usersService.findOneById(gatewayUser.id));
    }

    async chatInit(gatewayUser: GatewayUser) {
        gatewayUser.socket.emit('chatInit');
    }

    async privMsg(originUser: GatewayUser, payload: PrivMessagePayload) {
        const destinyUser = this.appGatewayService.getClientByUserId(payload.userId);
        if (!destinyUser)
            return ;

        const payloadToSend: PrivMessagePayload = {
			userId: originUser.id,
   			message: payload.message
		}
        destinyUser.socket.emit("privMessage", payloadToSend);
    }

    gatewayUserToChatUser(gatewayUser: GatewayUser): ChatUser {
		const chatUser: ChatUser = {
			id: gatewayUser.id, 
			username: gatewayUser.username
		}
		return chatUser;
	}
}