import type { ChatI, ChannelI, ChatUser, Message, ReturnMessage } from "./interfaces";
import { reactive } from 'vue';
import { user } from "./user";

interface UserChannelNamePayload {
	user: ChatUser,
	channelName: string
}

interface UsersIdsArrayChannelPayload {
	users: number[],
	channelName: string
}

interface UserArrayChannelPayload {
	users: ChatUser[],
	channelName: string
}

interface UserIdChannelPayload {
	userId: number,
	channel: ChannelPayload
}

interface ChannelMessagePayload {
	channel: string;
	from: ChatUser;
	message: string;
}

interface PasswordChannelPayload {
	password: string,
	channelName: string
}

interface PasswordBoolChannelPayload {
	password: boolean,
	channelName: string
}

interface ChannelPayload {
	name: string;
	users: ChatUser[];
	owner: ChatUser;
	admins: ChatUser[];
	usersMuted: number[];
	usersBanned: number[];
	isPrivate: boolean;
	messages: Message[];
}

type ChannelMap = {
	[id: string]: ChannelI;
}

class Channel{
	public channels: ChannelMap = {};
    public currentChannelChat: string = "";

	setEventsHandlers() {
		user.socket?.on('getChannels', (channels: ChannelPayload[]) => this.setAllChannels(channels));
		user.socket?.on('channelCreated', (channel: ChannelPayload) => this.onChannelCreated(channel));
		user.socket?.on('newChannel', (channel: ChannelPayload) => this.onNewChannel(channel));
		user.socket?.on('channelJoined', (channel: ChannelPayload) => this.onChannelJoined(channel));
		user.socket?.on('newUserJoined', (newUserPayload: UserChannelNamePayload) => this.onNewUserJoined(newUserPayload));

		user.socket?.on('deletedChannel', (channelName: string) => this.onDeletedChannel(channelName));
		user.socket?.on('channelLeft', (channel: ChannelPayload) => this.onChannelLeft(channel));
		user.socket?.on('userLeft', (payload: UserIdChannelPayload) => this.onUserLeft(payload));

		user.socket?.on('mutedUsersUpdated', (payload: UsersIdsArrayChannelPayload) => this.onMutedUsersUpdated(payload));
		user.socket?.on('bannedUsersUpdated', (payload: UsersIdsArrayChannelPayload) => this.onBannedUsersUpdated(payload));
		user.socket?.on('adminsUpdated', (payload: UserArrayChannelPayload) => this.onAdminsUpdated(payload));
		user.socket?.on('passwordUpdated', (payload: PasswordBoolChannelPayload) => this.onPasswordUpdated(payload));

		user.socket?.on('channelMessage', (message: ChannelMessagePayload) => this.receiveChannelMessage(message));

		this.initChannels();
	}

	initChannels(){
		user.socket?.emit('getChannels');
	}

	setAllChannels(channels: ChannelPayload[]) {
        for (const channel of channels) {
			this.onNewChannel(channel);
			if (this.userIsMemberOfChannel(channel.name)) {
				this.addChatToChannel(channel.name);
				channel.messages.forEach((message) => {
					if (!user.usersBlocked.find((u) => u.id === message.from.id))
						this.channels[channel.name].chat!.messages.push(message);
				});
			}
        }
	}

	joinChannel(channelName: string, password: string = ""): void {
		if (this.userIsMemberOfChannel(channelName))
			return;

		const payload = { password, channelName };
		user.socket?.emit('joinChannel', payload);
	}

	leaveChannel(channelName: string): void {
		user.socket?.emit('leaveChannel', channelName);
	}

    createChannel(channelName: string, password: string = ""): boolean {
		if (channelName in this.channels)
			return false;

		const payload = { password, channelName };
		user.socket?.emit('createChannel', payload);
		return true;
	}

	sendChannelMessage(channelName: string, message: string): void {
		const from: ChatUser = {
			id: user.id,
			username: user.username
		};
        const payload: ChannelMessagePayload = {
            channel: channelName,
			from,
			message: message
        };
        user.socket?.emit('channelMessage', payload);

		this.addMessageToChannelChat(channelName, from, payload.message);
    }

	getUsersOfChannel(channelName: string) {
		const channel = this.channels[channelName];
		if (channel) {
			return channel.users;
		} else {
			console.warn('Channel not found:', channelName);
		  return [];
		}
	  }

	userIsChannelAdmin(channel: ChannelI, channelUser: ChatUser = {id: user.id, username: user.username}): boolean {
		if (channel.admins.find(user => user.id === channelUser.id))
			return true;
		return false;
	}

	userIsMemberOfChannel(channelName: string, channelUser: ChatUser = {id: user.id, username: user.username}): boolean | null {
		const channel = this.channels[channelName];
		if (!channel)
			return null;
		if (channel.users.find(u => u.id === channelUser.id))
			return true;
		return false;
	}

	makeChannelAdmin(newAdmin: ChatUser, channelName: string): ReturnMessage {
		if (this.userIsChannelAdmin(this.channels[channelName], newAdmin))
			return { success: false, message: "cannot set admin: user is already admin" };

		if (!user.isWebsiteAdmin()) {
		 	if (!this.userIsChannelOwner(this.channels[channelName].name))
				return { success: false, message: "you are not allowed to manage channel administrators" };
			
			if (this.userIsChannelOwner(this.channels[channelName].name, newAdmin))
				return { success: false, message: "the channel owner is untouchable!" };
		}

		const payload: UserChannelNamePayload = { user: newAdmin, channelName };
		user.socket?.emit('setAdmin', payload);

		return { success: true };
	}

	removeChannelAdmin(admin: ChatUser, channelName: string): ReturnMessage {
		if (!this.userIsChannelAdmin(this.channels[channelName], admin))
			return { success: false, message: "cannot remove admin: user is not admin" };

		if (!user.isWebsiteAdmin()) {
			if (!this.userIsChannelOwner(this.channels[channelName].name))
				return { success: false, message: "you are not allowed to manage channel administrators" };
			
			if (this.userIsChannelOwner(this.channels[channelName].name, admin))
				return { success: false, message: "the channel owner is untouchable!" };
		}

		const payload: UserChannelNamePayload = { user: admin, channelName };
		user.socket?.emit('unsetAdmin', payload);

		return { success: true };
	}

	muteUser(mutedUser: ChatUser, channelName: string): ReturnMessage {
		if (!user.isWebsiteAdmin()) {
			if (!this.userIsChannelAdmin(this.channels[channelName]))
				return { success: false, message: "you are not allowed to mute users" };

			if (mutedUser.id == user.id)
				return { success: false, message: "you cannot mute yourself!" };

			if (this.userIsChannelOwner(channelName, mutedUser))
				return { success: false, message: "the channel owner is untouchable!" };
		}

		const payload: UserChannelNamePayload = {
			user: mutedUser,
			channelName: channelName
		}
		user.socket?.emit('muteUser', payload);

		return { success: true };
	}

	unmuteUser(unmutedUser: ChatUser, channelName: string): ReturnMessage {
		if (!user.isWebsiteAdmin()) {
			if (!this.userIsChannelAdmin(this.channels[channelName]))
				return { success: false, message: "you are not allowed to unmute users" };

			if (unmutedUser.id == user.id)
				return { success: false, message: "you cannot unmute yourself!" };

			if (this.userIsChannelOwner(channelName, unmutedUser))
				return { success: false, message: "the channel owner is untouchable!" };
		}

		const payload: UserChannelNamePayload = {
			user: unmutedUser,
			channelName: channelName
		}
		user.socket?.emit('unmuteUser', payload);

		return { success: true };
	}

	kickUser(kickedUser: ChatUser, channelName: string): ReturnMessage {
		if (!user.isWebsiteAdmin()) {
			if (!this.userIsChannelAdmin(this.channels[channelName]))
				return { success: false, message: "you are not allowed to kick users" };

			if (kickedUser.id == user.id)
				return { success: false, message: "you cannot kick yourself!" };

			if (this.userIsChannelOwner(channelName, kickedUser))
				return { success: false, message: "the channel owner is untouchable!" };
		}
		
		const payload: UserChannelNamePayload = {
			user: kickedUser,
			channelName: channelName
		}
		user.socket?.emit('kickUser', payload);

		return { success: true };
	}

	banUser(bannedUser: ChatUser, channelName: string): ReturnMessage {
		if (!user.isWebsiteAdmin()) {
			if (!this.userIsChannelAdmin(this.channels[channelName]))
				return { success: false, message: "you are not allowed to ban users" };
			
			if (bannedUser.id == user.id)
				return { success: false, message: "you cannot ban yourself!" };

			if (this.userIsChannelOwner(channelName, bannedUser))
				return { success: false, message: "the channel owner is untouchable!" };
		}
		
		const payload: UserChannelNamePayload = {
			user: bannedUser,
			channelName: channelName
		}
		user.socket?.emit('banUser', payload);

		return { success: true };
	}

	unbanUser(unbannedUser: ChatUser, channelName: string): ReturnMessage {
		if (!user.isWebsiteAdmin()) {
			if (!this.userIsChannelAdmin(this.channels[channelName]))
				return { success: false, message: "you are not allowed to ban users" };
			
			if (unbannedUser.id == user.id)
				return { success: false, message: "you cannot ban yourself!" };

			if (this.userIsChannelOwner(channelName, unbannedUser))
				return { success: false, message: "the channel owner is untouchable!" };
		}
		
		const payload: UserChannelNamePayload = {
			user: unbannedUser,
			channelName: channelName
		}
		user.socket?.emit('unbanUser', payload);

		return { success: true };
	}

	userIsMutedInChannel(channelName: string, channelUser: ChatUser = {id: user.id, username: user.username}): boolean {
		const channel = this.channels[channelName];
		if (!channel)
			return false;
		if (channel.usersMuted.find(id => id === channelUser.id))
			return true;
		return false;
	}

	userIsChannelOwner(channelName: string, channelUser: ChatUser = {id: user.id, username: user.username}): boolean {
		const channel = this.channels[channelName];
		if (!channel)
			return false;
		return (channel.owner.id === channelUser.id);
	}

	setPassword(password: string, channelName: string): ReturnMessage {
		if (!this.userIsChannelOwner(this.channels[channelName].name))
			return { success: false, message: "you are not allowed to manage this channel\'s password" };

		if (password.length === 0)
			return { success: false, message: `please enter a password for channel '${channelName}'` };

		const payload: PasswordChannelPayload = { password, channelName };
		user.socket?.emit('setPassword', payload);

		return { success: true };
	}

	unsetPassword(channelName: string): ReturnMessage {
		if (!this.userIsChannelOwner(this.channels[channelName]?.name))
			return { success: false, message: 'you are not allowed to manage this channel\'s password' };
		if (this.channels[channelName].isPrivate === false)
			return { success: false, message: 'cannot unset this channel\'s password: channel is not private' };

		user.socket?.emit('unsetPassword', channelName);

		return { success: true };
	}

	isChannelPrivate(channelName: string) : boolean {
		const channel = this.channels[channelName];
		if (!channel)
			return false;
		return channel.isPrivate;
	}

	deleteChannel(channelName: string): boolean {
		if (this.userIsChannelOwner(channelName) || user.isWebsiteAdmin()) {
			user.socket?.emit('deleteChannel', channelName);
			return true;
		}
		return false;
	}

	//cuando lo crea este usuario
	private onChannelCreated(newChannel: ChannelPayload): void {
		this.channels[newChannel.name] = {...newChannel, chat: null};
		this.addChatToChannel(newChannel.name);
	}

	//cuando alguien crea un canal
	private onNewChannel(channel: ChannelPayload): void {
		this.channels[channel.name] = {...channel, chat: null};
	}

	// cuando se va este usuario de un canal
	private onChannelLeft(channel: ChannelPayload): void {
		this.channels[channel.name] = {...channel, chat: null};
	}

	// cuando se va alguien de un canal
	private onUserLeft(payload: UserIdChannelPayload): void {
		const { channel, userId } = { ...payload };
		this.channels[channel.name] = {...channel, chat: this.channels[channel.name].chat};
	}

	private onDeletedChannel(channelName: string): void {
		delete(this.channels[channelName]);
	}

	private addChatToChannel(channelName: string): void {
        if (this.channels[channelName] && !this.channels[channelName].chat) {
            const newChat: ChatI = {
                target: channelName,
                messages: [],
                notification: false,
				challenge: 0
            }
            this.channels[channelName].chat = newChat;
        }
    }

	// cuando se une este usuario a un canal
	private onChannelJoined(channel: ChannelPayload): void {
		this.channels[channel.name].users.push({id: user.id, username: user.username});
		if (!this.channels[channel.name].chat) {
			this.addChatToChannel(channel.name);
			channel.messages.forEach((message) => {
				if (!user.usersBlocked.find((u) => u.id === message.from.id))
					this.channels[channel.name].chat!.messages.push(message);
			});
		}
	}

	// cuando se une alguien a un canal
	private onNewUserJoined(newUserPayload: UserChannelNamePayload): void {
		const {channelName, user} = newUserPayload;
		this.channels[channelName].users.push(user);
	}

	private addMessageToChannelChat(channelName: string, fromUser: ChatUser, message: string): void {
		const channel = this.channels[channelName];
		if (!channel)
			return;

		if (user.usersBlocked.find((u) => u.id === fromUser.id))
			return;

		const newMessage: Message = {
            from: fromUser,
            message: message
        }

        const chat: ChatI | null = channel.chat;
        if (chat) {
			chat.messages.push(newMessage);
			if (this.currentChannelChat !== channel.name)
				chat.notification = true;
		}
	}

	private onPasswordUpdated(payload: PasswordBoolChannelPayload): void {
		this.channels[payload.channelName].isPrivate = payload.password;
	}

	private onMutedUsersUpdated(payload: UsersIdsArrayChannelPayload): void {
		this.channels[payload.channelName].usersMuted = payload.users;
	}

	private onBannedUsersUpdated(payload: UsersIdsArrayChannelPayload): void {
		this.channels[payload.channelName].usersBanned = payload.users;
	}

	private onAdminsUpdated(payload: UserArrayChannelPayload): void {
		this.channels[payload.channelName].admins = payload.users;
	}

	private receiveChannelMessage(payload: ChannelMessagePayload): void {
		this.addMessageToChannelChat(payload.channel, payload.from, payload.message);
	}
}

export const channel = reactive<Channel>(new Channel());