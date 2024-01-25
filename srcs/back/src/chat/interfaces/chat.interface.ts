export interface Message {
	from: ChatUser;
	message: string;
}

export interface ChatUser {
    id: number;
    username: string;
}

export interface UserChannelNamePayload {
	user: ChatUser,
	channelName: string
}

export interface NewChannelPayload {
	password: string,
	channelName: string
}

export interface ChannelPayload {
	name: string;
	users: ChatUser[];
	owner: ChatUser;
	admins: ChatUser[];
	usersMuted: number[];
	usersBanned: number[];
	messages: Message[];
	isPrivate: boolean;
}

export interface PrivMessagePayload {
    userId: number;
    message: string;
}

export interface ChannelMessagePayload {
	channel: string;
	from: ChatUser;
	message: string;
}