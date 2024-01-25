import { Injectable } from "@nestjs/common";
import Channel from "./channel.class";
import { ChatService } from "./chat.service";
import { AppGatewayService } from "src/app-gateway/appGateway.service";
import { GatewayUser } from "src/app-gateway/interfaces/gateway-user.interface";
import { NewChannelPayload, ChannelPayload, UserChannelNamePayload, ChatUser, ChannelMessagePayload} from './interfaces/chat.interface';
import { Server } from 'socket.io';

@Injectable()
export class ChannelsService {
	
	private channels: Channel[] = [];

	constructor(
		private chatService: ChatService,
        private appGatewayService: AppGatewayService,
    ) {}

	getChannels(gatewayUser: GatewayUser) {
		const channelPayload : ChannelPayload[] = [];
		for (const channel of this.channels) {
			channelPayload.push(this.channelToChannelPayload(channel));
			if (channel.hasUser(gatewayUser)) {
				gatewayUser.socket.join(channel.name);
			}
		}
		gatewayUser.socket.emit("getChannels", channelPayload);
	}

	getChannelForModerator(gatewayUser: GatewayUser, channelName: string) {
		const channel = this.getChannelbyName(channelName);
		if (channel)
			gatewayUser.socket.emit("channelForModerator", this.channelToChannelPayload(channel));
	}

	getChannelbyName(channelName: string): Channel | null {
		const channel: Channel | undefined = this.channels.find((channel) => channel.name === channelName);
		if (channel)
			return channel;
		return null;
	}

	newChannel(payload: NewChannelPayload, owner: GatewayUser): boolean {
		const { channelName, password } = payload;
		if (this.getChannelbyName(channelName))
			return false;

		const newChannel: Channel = new Channel(channelName, owner);
		if (password != "")
			newChannel.setPassword(payload.password);

		this.channels.push(newChannel);
		owner.socket.emit('channelCreated', this.channelToChannelPayload(newChannel));

		owner.socket.join(channelName);

		const channelPayload: ChannelPayload = this.channelToChannelPayload(newChannel);
		owner.socket.broadcast.emit('newChannel', channelPayload);

		return true;
	}

	userJoinChannel(user: GatewayUser, payload: NewChannelPayload): boolean {
		const channel: Channel = this.getChannelbyName(payload.channelName);
		if (!channel)
			return false;

		if (channel.password != null && payload.password !== channel.password) {
			user.socket.emit('wrongPassword', payload.channelName);
			return false;
		}

		channel.addUser(user);
		user.socket.join(payload.channelName);

		const channelPayload: ChannelPayload = this.channelToChannelPayload(channel);
		user.socket.emit('channelJoined', channelPayload);

		const newUserPayload: UserChannelNamePayload = {
			user: this.chatService.gatewayUserToChatUser(user),
			channelName: payload.channelName
		}
		user.socket.to(payload.channelName).emit('newUserJoined', newUserPayload);

		this.channelUpdateForModerators(channel);
		return true;
	}

	userLeaveChannel(user: GatewayUser, channelName: string, server: Server): boolean {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(user))
			return false;

		this.removeUserFromChannel(user, channel);

		if (channel.users.length == 0) {
			this.channels = this.channels.filter((c) => c.name != channel.name);
			server.emit('deletedChannel', channel.name);
			return false;
		}

		this.userLeaveSocketRoom(user, channelName);

		this.channelUpdateForModerators(channel);
		return true;
	}

	setPassword(user: GatewayUser, payload: NewChannelPayload, server: Server): void {
		const channel: Channel = this.getChannelbyName(payload.channelName);
		if (!channel)
			return;
		if (user.id != channel.owner.id || !channel.hasUser(user))
			return;

		channel.setPassword(payload.password);

		const clientPayload = {
			password: true,
			channelName: channel.name
		}
		server.emit('passwordUpdated', clientPayload)
	}

	unsetPassword(user: GatewayUser, channelName: string, server: Server): void {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel)
			return;
		if (user.id != channel.owner.id || !channel.hasUser(user))
			return;

		channel.unsetPassword();

		const clientPayload = {
			password: false,
			channelName: channelName
		}
		server.emit('passwordUpdated', clientPayload)
	}

	setAdmin(user: GatewayUser, newAdmin: GatewayUser, channelName: string, server: Server): void {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(newAdmin))
			return;

		if (!this.appGatewayService.clientIsWebsiteAdmin(user)) {
			if (user.id != channel.owner.id || !channel.hasUser(user))
				return;
		}

		channel.setAdmin(newAdmin);

		const admins: ChatUser[] = channel.admins.map((admin) => this.chatService.gatewayUserToChatUser(admin));
		const payload = {
			users: admins,
			channelName
		};
		newAdmin.socket.emit('adminPromote', channelName);
		server.emit('adminsUpdated', payload);
		this.channelUpdateForModerators(channel);
	}

	unsetAdmin(user: GatewayUser, admin: GatewayUser, channelName: string, server: Server): void {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(admin))
			return;

		if (!this.appGatewayService.clientIsWebsiteAdmin(user)) {
			if (user.id != channel.owner.id || !channel.hasUser(user))
				return;
		}
		
		channel.unsetAdmin(admin);

		const admins: ChatUser[] = channel.admins.map((admin) => this.chatService.gatewayUserToChatUser(admin));
		const payload = {
			users: admins,
			channelName
		};
		admin.socket.emit('adminDemote', channelName);
		server.emit('adminsUpdated', payload);
		this.channelUpdateForModerators(channel);
	}

	muteUser(muterUser: GatewayUser, mutedUser: GatewayUser, channelName: string, server: Server): boolean {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(mutedUser))
			return false;

		if (!this.appGatewayService.clientIsWebsiteAdmin(muterUser)) {
			if (!channel.userIsAdmin(muterUser) || !channel.hasUser(muterUser))
				return false;
		}

		channel.muteUser(mutedUser);

		const payload = {
			users: channel.mutedUsersIds,
			channelName: channelName
		};

		server.emit('mutedUsersUpdated', payload);
		mutedUser.socket.emit('youMuted', channelName);

		this.channelUpdateForModerators(channel);
		return true;
	}

	unmuteUser(unmuterUser: GatewayUser, unmutedUser: GatewayUser, channelName: string, server: Server): boolean {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(unmutedUser))
			return false;

		if (!this.appGatewayService.clientIsWebsiteAdmin(unmuterUser)) {
			if (!channel.userIsAdmin(unmuterUser) || !channel.hasUser(unmuterUser))
				return false;
		}

		channel.unmuteUser(unmutedUser);

		const payload = {
			users: channel.mutedUsersIds,
			channelName: channelName
		};

		server.emit('mutedUsersUpdated', payload);
		unmutedUser.socket.emit('youUnmuted', channelName);

		this.channelUpdateForModerators(channel);
		return true;
	}

	kickUser(kickerUser: GatewayUser, kickedUser: GatewayUser, channelName: string, server: Server): boolean {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(kickedUser))
			return false;

		if (!this.appGatewayService.clientIsWebsiteAdmin(kickerUser)) {
			if (!channel.userIsAdmin(kickerUser) || !channel.hasUser(kickerUser))
				return false;
		}

		this.removeUserFromChannel(kickedUser, channel);

		if (channel.users.length == 0) {
			this.channels = this.channels.filter((c) => c.name != channel.name);
			server.emit('deletedChannel', channel.name);
			return false;
		}

		this.userLeaveSocketRoom(kickedUser, channelName);
		kickedUser.socket.emit('userKicked', channelName);

		this.channelUpdateForModerators(channel);
		return true;
	}

	banUser(bannerUser: GatewayUser, bannedUser: GatewayUser, channelName: string, server: Server): boolean {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(bannedUser))
			return false;

		if (!this.appGatewayService.clientIsWebsiteAdmin(bannerUser)) {
			if (!channel.userIsAdmin(bannerUser) || !channel.hasUser(bannerUser))
				return false;
		}

		channel.banUser(bannedUser);

		const payload = {
			users: channel.bannedUsersIds,
			channelName: channelName
		};

		server.emit('bannedUsersUpdated', payload);
		bannedUser.socket.emit('youBanned', channelName);

		this.userLeaveSocketRoom(bannedUser, channelName);

		this.channelUpdateForModerators(channel);
		return true;
	}

	unbanUser(unbannerUser: GatewayUser, unbannedUser: GatewayUser, channelName: string, server: Server): boolean {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel || !channel.hasUser(unbannedUser))
			return false;

		if (!this.appGatewayService.clientIsWebsiteAdmin(unbannerUser)) {
			if (!channel.userIsAdmin(unbannerUser) || !channel.hasUser(unbannerUser))
				return false;
		}

		channel.unbanUser(unbannedUser);

		const payload = {
			users: channel.bannedUsersIds,
			channelName: channelName
		};

		server.emit('bannedUsersUpdated', payload);
		unbannedUser.socket.emit('youUnbanned', channelName);

		unbannedUser.socket.join(channelName);
		this.channelUpdateForModerators(channel);
		return true;
	}

	channelMessage(fromUser: GatewayUser, payload: ChannelMessagePayload): void {
		const channel: Channel = this.getChannelbyName(payload.channel);
		if (!channel || !channel.hasUser(fromUser))
			return ;

		channel.addMessage({message: payload.message, from: payload.from});
		fromUser.socket.to(payload.channel).emit("channelMessage", payload);

		const moderators = this.appGatewayService.getAllWebsiteAdminClients();
		moderators.forEach(moderator => {
			moderator.socket.emit('channelMessageForModerator', payload);
		});
	}

	deleteChannel(user: GatewayUser, channelName: string, server: Server): void {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel)
			return;
		if (this.appGatewayService.clientIsWebsiteAdmin(user) || user.id === channel.owner.id) {
			server.to(channelName).emit('deletedChannelMember', channel.name);
			channel.users.forEach((user) => {
				user.socket.leave(channel.name);
			})
			this.channels = this.channels.filter((c) => c.name != channel.name);
			server.emit('deletedChannel', channel.name);
		}
	}

	channelUpdateForModerators(channel: Channel) {
		const moderators = this.appGatewayService.getAllWebsiteAdminClients();
		const channelPayload = this.channelToChannelPayload(channel);
		moderators.forEach(moderator => {
			moderator.socket.emit('channelUpdateForModerator', channelPayload);
		});
	}

	sendServerMessageToChannel(channelName: string, server: Server, message: string): void {
		const channel: Channel = this.getChannelbyName(channelName);
		if (!channel)
			return ;

		const from: ChatUser = {
			id: -1,
			username: `#${channelName} server`
		}

		const payload: ChannelMessagePayload = {
			channel: channelName,
			from,
			message
		}
		channel.addMessage({message, from: payload.from});
		server.to(channelName).emit("channelMessage", payload);

		const moderators = this.appGatewayService.getAllWebsiteAdminClients();
		moderators.forEach(moderator => {
			moderator.socket.emit('channelMessageForModerator', payload);
		});
	}

	private removeUserFromChannel(user: GatewayUser, channel: Channel): void {
		channel.removeUser(user);

		const channelPayload: ChannelPayload = this.channelToChannelPayload(channel);

		user.socket.emit('channelLeft', channelPayload);

		const payload = {
			userId: user.id,
			channel: channelPayload
		}
		user.socket.to(channel.name).emit('userLeft', payload);
	}

	private channelToChannelPayload(channel: Channel): ChannelPayload {
		const payload: ChannelPayload = {
			name: channel.name,
			users: channel.users.map((user) => this.chatService.gatewayUserToChatUser(user)),
			owner: this.chatService.gatewayUserToChatUser(channel.owner),
			admins: channel.admins.map((user) => this.chatService.gatewayUserToChatUser(user)),
			usersMuted: channel.mutedUsersIds,
			usersBanned: channel.bannedUsersIds,
			isPrivate: channel.password === null ? false : true,
			messages: channel.messages
		};
		return payload;
	}

	private userLeaveSocketRoom(user: GatewayUser, channelName: string): void {
		user.socket.leave(channelName);
	}
}