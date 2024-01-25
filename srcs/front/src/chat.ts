import type { ChatI, ChannelI, ChatUser, Message, ReturnMessage, UserData } from "./interfaces";
import { reactive } from 'vue';
import { user } from "./user";
import { channel } from "./channel";

interface MessagePayload {
    userId: number;
    message: string;
}

type ChatMap = {
	[id: number]: ChatI;
}

class Chat{
	public chats: ChatMap = {};
    public currentChat: number = -1;

    setEventsHandlers() {
        this.initChats();
        user.socket?.on('privMessage', (payload: MessagePayload) => {this.receiveDirectMessage(payload)});
    }

    initChats() {
        for (const currentUser of user.usersOnline) {
            this.addChat(currentUser);
        }
	}

    private async receiveDirectMessage(payload: MessagePayload) {
        const fromUserData: UserData | null = await user.getUserOnlineById(payload.userId);
        if (!fromUserData)
            return;

        const fromUser: ChatUser = {id:fromUserData.id, username:fromUserData.username};
        if (user.usersBlocked.find((u) => u.id === fromUser.id))
            return;

        const newMessage: Message = {
            from: fromUser,
            message: payload.message
        }
        const chat: ChatI | undefined = this.chats[fromUser.id];

        if (chat) {
            chat.messages.push(newMessage);
            if (this.currentChat !== fromUser.id)
                chat.notification = true;
        }
    }
    sendDirectMessage(toUserId: number, message: string) {
        const payload: MessagePayload = {
            userId: toUserId,
            message: message
        };
        user.socket?.emit('privMessage', payload);

        const newMessage: Message = {
            from : {id: user.id, username: user.username},
            message: message
        }
        const friendChat: ChatI | undefined = this.chats[toUserId];
        if (friendChat)
            friendChat.messages.push(newMessage);
    }

    private addChat(user: ChatUser): void {
        if (!this.chats[user.id]) {
            const newChat: ChatI = {
                target: user,
                messages: [],
                notification: false,
                challenge: 0
            }
            this.chats[user.id] = newChat;
        }
    }

}

export const chat = reactive<Chat>(new Chat());