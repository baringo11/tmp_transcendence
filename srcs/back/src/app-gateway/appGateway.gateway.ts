import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { Socket, Server } from 'socket.io'
import { JwtService } from '@nestjs/jwt';

import { AppGatewayService } from './appGateway.service';
import { GatewayUser } from './interfaces/gateway-user.interface';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/interfaces/user-roles';

@WebSocketGateway({cors: true})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private appGatewayService: AppGatewayService,
		private jwtService: JwtService,
		private usersService: UsersService
	) {}

	@WebSocketServer() server: Server;

	async handleConnection(client: Socket, ...args: any[]) {
		const clientToken = client.handshake.auth.token;
		let validToken;

		try {
			validToken = this.jwtService.verify(clientToken);
		}
		catch (e) {
			client.disconnect();
			return;
		}

		const user: User = await this.usersService.findOneById(validToken.id);
		if (!user) {
			client.disconnect();
			return;
		}

		const gatewayUser: GatewayUser = {
			id: validToken.id,
			socket: client,
			token: clientToken,
			username: user.username,
			isGaming: false,
			role: user.role
		}

		const userExists = this.appGatewayService.getClientByUserId(gatewayUser.id);
		if (userExists) {
			client.emit("alreadyConnected");
			client.disconnect();
			return;
		}

		this.appGatewayService.addClient(gatewayUser);
		this.usersService.addUserOnline(gatewayUser.id);
		this.server.emit('connected', {id: gatewayUser.id, username: gatewayUser.username});
	}

	handleDisconnect(client: Socket) {
		const gatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!gatewayUser)
			return;
		this.usersService.subtractUserOnline(gatewayUser.id);
		this.server.emit('disconnected', {id: gatewayUser.id, username: gatewayUser.username});
	}

  	@SubscribeMessage("user-updated")
	notifyOfUpdatedUser(client: Socket, payload: any): Promise<void> {
		const gatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!gatewayUser)
			return;
		this.appGatewayService.onUserUpdated(gatewayUser);
	}

	@SubscribeMessage("new-website-admin")
	notifyOfNewWebsiteAdmin(client: Socket, newAdminUserId: number): void {
		this.appGatewayService.onUserRoleUpdated(newAdminUserId, UserRole.ADMIN);
	}

	@SubscribeMessage("remove-website-admin")
	notifyOfWebsiteAdminRemoval(client: Socket, adminUserId: number): void {
		this.appGatewayService.onUserRoleUpdated(adminUserId, UserRole.USER);
	}

	@SubscribeMessage("ban-from-website")
	notifyOfWebsiteBan(client: Socket, bannedUserId: number): void {
		this.appGatewayService.onUserBanned(bannedUserId);
	}
}
