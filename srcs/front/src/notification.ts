// notificationService.ts
import type { ChatUser} from "./interfaces";
import { reactive } from 'vue';
import { user } from "./user";

export interface NotificationI {
  message: string;
}

class Notification {

  public state = reactive<NotificationI[]>([]);

	setEventHandlers() {
    user.socket?.on('addedAsFriend', (friend: ChatUser) => {
      this.notify({message: `'${friend.username}' added you as a friend`})
    });
    user.socket?.on('removedAsFriend', (friend: ChatUser) => {
      this.notify({message: `'${friend.username}' has removed you as a friend`})
    });
    user.socket?.on('userKicked', (channelName: string) => {
      this.notify({message: `You've been kicked from '${channelName}' channel!`})
    });
    user.socket?.on('youMuted', (channelName: string) => {
      this.notify({message: `You've been muted from '${channelName}' channel!`})
    });
    user.socket?.on('youUnmuted', (channelName: string) => {
      this.notify({message: `You've been unmuted from '${channelName}' channel!`})
    });
    user.socket?.on('youBanned', (channelName: string) => {
      this.notify({message: `You've been banned from '${channelName}' channel!`})
    });
    user.socket?.on('youUnbanned', (channelName: string) => {
      this.notify({message: `You've been unbanned from '${channelName}' channel!`})
    });
    user.socket?.on('wrongPassword', (channelName: string) =>  {
      this.notify({message: `Wrong password for '${channelName}' channel!`})
    });
    user.socket?.on('deletedChannelMember', (channelName: string) =>  {
      this.notify({message: `Channel '${channelName}' has been deleted!`})
    });
    user.socket?.on('adminPromote', (channelName: string) =>  {
      this.notify({message: `You have been promoted to Admin in Channel '${channelName}'!`})
    });
    user.socket?.on('adminDemote', (channelName: string) =>  {
      this.notify({message: `You've been demoted to regular user in Channel '${channelName}'!`})
    });
    user.socket?.on('challenge-refused', (username: string) =>  {
      this.notify({message: `'${username}' has refused your challenge invitation!`})
    });
  }

  notify(notification: NotificationI) {
    this.state.push(notification);
    setTimeout(() => {
      const index = this.state.indexOf(notification);
      if (index > -1) {
        this.state.splice(index, 1);
      }
    }, 5000);
  }

  clearNotifications() {
    this.state.length = 0;
  }

}

export const notification = reactive<Notification>(new Notification);