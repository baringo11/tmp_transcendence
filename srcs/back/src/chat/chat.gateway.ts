import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AppGateway } from '../app-gateway/appGateway.gateway';
import { AppGatewayService } from '../app-gateway/appGateway.service';
import { GatewayUser } from '../app-gateway/interfaces/gateway-user.interface';
import { ChatService } from './chat.service';
import { ChannelsService } from './channel.service';
import { PrivMessagePayload, NewChannelPayload, ChannelMessagePayload, UserChannelNamePayload } from './interfaces/chat.interface';

@WebSocketGateway()
export class ChatGateway {
	constructor(
		private appGateway: AppGateway,
		private appGatewayService: AppGatewayService,
		private chatService: ChatService,
		private channelsService: ChannelsService,
	) { }

  	@WebSocketServer() server: Server;

	@SubscribeMessage('chatConnect')
	chatConnection(client: Socket) {
		const gatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!gatewayUser)
			return;
		return this.chatService.chatConnect(gatewayUser);
	}

	@SubscribeMessage('chatDisconnect')
	chatDisconnect(client: Socket) {
		const gatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!gatewayUser)
			return;
		return this.chatService.chatDisconnect(gatewayUser);
	}

	@SubscribeMessage('privMessage')
	ChatPrivMsg(client: Socket, payload: PrivMessagePayload) {
		const originUser: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!originUser)
			return;
		return this.chatService.privMsg(originUser, payload);
	}

	@SubscribeMessage('getChannels')
	getChannels(client: Socket) {
		const gatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!gatewayUser)
			return;
		return this.channelsService.getChannels(gatewayUser);
	}

	@SubscribeMessage('getChannelForModerator')
	getChannelForModerator(client: Socket, channelName: string) {
		const gatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		if (!gatewayUser)
			return;
		return this.channelsService.getChannelForModerator(gatewayUser, channelName);
	}


  	@SubscribeMessage("createChannel")
	newChannel(client: Socket, payload: NewChannelPayload): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const created: boolean = this.channelsService.newChannel(payload, user);
		if (created) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName,
				this.appGateway.server,
				`user <${user.username}> created the channel.`
			);
		}
	}

  	@SubscribeMessage("joinChannel")
	joinChannel(client: Socket, payload: NewChannelPayload): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const joined: boolean = this.channelsService.userJoinChannel(user, payload);
		if (joined) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName,
				this.appGateway.server,
				`user <${user.username}> joined the channel.`
			);
		}
	}

	@SubscribeMessage("leaveChannel")
	leaveChannel(client: Socket, channelName: string): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const left: boolean = this.channelsService.userLeaveChannel(user, channelName, this.appGateway.server);
		if (left) {
			this.channelsService.sendServerMessageToChannel(
				channelName, 
				this.appGateway.server,
				`user <${user.username}> left the channel.`
			);
		}
	}

	@SubscribeMessage("deleteChannel")
	deleteChannel(client: Socket, channelName: string): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		this.channelsService.deleteChannel(user, channelName, this.appGateway.server);
	}

	@SubscribeMessage("setPassword")
	setPassword(client: Socket, payload: NewChannelPayload): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		this.channelsService.setPassword(user, payload, this.appGateway.server);
	}

	@SubscribeMessage("unsetPassword")
	unsetPassword(client: Socket, channelName: string): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		this.channelsService.unsetPassword(user, channelName, this.appGateway.server);
	}

	@SubscribeMessage("setAdmin")
	setAdmin(client: Socket, payload: UserChannelNamePayload): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const newAdmin: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		this.channelsService.setAdmin(user, newAdmin, payload.channelName, this.appGateway.server);
	}

	@SubscribeMessage("unsetAdmin")
	unsetAdmin(client: Socket, payload: UserChannelNamePayload): void {
		const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const admin: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		this.channelsService.unsetAdmin(user, admin, payload.channelName, this.appGateway.server);
	}

	@SubscribeMessage("muteUser")
	muteUser(client: Socket, payload: UserChannelNamePayload): void {
		const muter: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const muted: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		const mutedOk: boolean = this.channelsService.muteUser(muter, muted, payload.channelName, this.appGateway.server);
		if (mutedOk) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName, 
				this.appGateway.server,
				`user <${payload.user.username}> was muted.`
			);
		}
	}

	@SubscribeMessage("unmuteUser")
	unmuteUser(client: Socket, payload: UserChannelNamePayload): void {
		const muter: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const muted: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		const mutedOk: boolean = this.channelsService.unmuteUser(muter, muted, payload.channelName, this.appGateway.server);
		if (mutedOk) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName, 
				this.appGateway.server,
				`user <${payload.user.username}> was unmuted.`
			);
		}
	}

	@SubscribeMessage("kickUser")
	kickUser(client: Socket, payload: UserChannelNamePayload): void {
		const kicker: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const kicked: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		const kickedOk: boolean = this.channelsService.kickUser(kicker, kicked, payload.channelName, this.appGateway.server);
		if (kickedOk) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName, 
				this.appGateway.server,
				`user <${payload.user.username}> was kicked from the channel.`
			);
		}
	}

	@SubscribeMessage("banUser")
	banUser(client: Socket, payload: UserChannelNamePayload): void {
		const banner: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const banned: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		const bannedOK: boolean = this.channelsService.banUser(banner, banned, payload.channelName, this.appGateway.server);
		if (bannedOK) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName, 
				this.appGateway.server,
				`user <${payload.user.username}> was banned.`
			);
		}
	}

	@SubscribeMessage("unbanUser")
	unbanUser(client: Socket, payload: UserChannelNamePayload): void {
		const banner: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const banned: GatewayUser = this.appGatewayService.getClientByUserId(payload.user.id);
		const bannedOK: boolean = this.channelsService.unbanUser(banner, banned, payload.channelName, this.appGateway.server);
		if (bannedOK) {
			this.channelsService.sendServerMessageToChannel(
				payload.channelName, 
				this.appGateway.server,
				`user <${payload.user.username}> was unbanned.`
			);
		}
	}

	@SubscribeMessage("addFriend")
	addFriend(client: Socket, friendId: number): void {
		const fromUser: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const friend: GatewayUser = this.appGatewayService.getClientByUserId(friendId);
		friend.socket.emit("addedAsFriend", this.chatService.gatewayUserToChatUser(fromUser));
	}

	@SubscribeMessage("removeFriend")
	deleteFriend(client: Socket, friendId: number): void {
		const fromUser: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		const friend: GatewayUser = this.appGatewayService.getClientByUserId(friendId);
		friend.socket.emit("removedAsFriend", this.chatService.gatewayUserToChatUser(fromUser));
	}

  	@SubscribeMessage("channelMessage")
	channelMessage(client: Socket, payload: ChannelMessagePayload): void {
		const fromUser: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		this.channelsService.channelMessage(fromUser, payload);
	}
}
