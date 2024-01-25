import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { GatewayUser } from './interfaces/gateway-user.interface';
import { UserRole } from 'src/users/interfaces/user-roles';

@Injectable()
export class AppGatewayService {

	private users: GatewayUser[] = [];

	constructor(
        @Inject(UsersService)
		private usersService: UsersService,
	) {}

	getClientByUserId(id: number): GatewayUser {
		return this.users.find((user) => user.id == id);
	}

	getClientBySocketId(id: string): GatewayUser {
		return this.users.find((user) => user.socket.id == id);
	}

	getAllClients(): GatewayUser[] {
		return this.users;
	}

	clientIsWebsiteAdmin(client: GatewayUser) {
		return (client.role == UserRole.ADMIN || client.role == UserRole.OWNER)
	}

	getAllWebsiteAdminClients(): GatewayUser[] {
		return this.users.filter((user) => this.clientIsWebsiteAdmin(user));
	}

	addClient(user: GatewayUser): void {
		this.users.push(user);
	}

	removeClient(socketId: string): void {
		this.users = this.users.filter((u) => u.socket.id != socketId);
	}

	onUserRoleUpdated(userId: number, newRole: UserRole) {
		const adminGatewayUser = this.getClientByUserId(userId);
		if (!adminGatewayUser)
			return;

		adminGatewayUser.role = newRole;

		if (newRole == UserRole.ADMIN)
			adminGatewayUser.socket.emit("website-admin");
		else if (newRole == UserRole.USER)
			adminGatewayUser.socket.emit("remove-website-admin");
	}

	onUserBanned(userId: number) {
		const bannedGatewayUser = this.getClientByUserId(userId);
		if (!bannedGatewayUser)
			return;

		bannedGatewayUser.socket.emit("banned-from-website");
	}

	setGatewayUserGamingStatus(id: number) {
		const user: GatewayUser = this.users.find((u) => u.id == id);
		if (user)
			user.isGaming = true;
	}

	unsetGatewayUserGamingStatus(id: number) {
		const user: GatewayUser = this.users.find((u) => u.id == id);
		if (user)
			user.isGaming = false;
	}

	async onUserUpdated(client: GatewayUser) {
		const user: User = await this.usersService.findOneById(client.id);
		const { id, username } = user;

		client.username = username;

		client.socket.broadcast.emit("user-updated", { id, username });
	}
}
