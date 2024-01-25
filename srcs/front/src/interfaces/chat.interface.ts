export interface Message {
	from: ChatUser;
	message: string;
}

export enum ChallengeState {
    None,
    Challenged,
    Challenger
}

export interface ChatI {
    messages: Message[];
    notification: boolean;
    challenge: ChallengeState;
	target: ChatUser | string;
}

export interface ChatUser {
    id: number;
    username: string;
}

export interface ChannelI {
	name: string;
	users: ChatUser[];
	owner: ChatUser;
	admins: ChatUser[];
	usersMuted: number[];
	usersBanned: number[];
	chat: ChatI | null;
	isPrivate: boolean;
}