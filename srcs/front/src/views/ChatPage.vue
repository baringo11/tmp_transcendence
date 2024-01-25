<template>
  <MainMenu />
  <div class="main-frame">

    <div class="chat-page-container">

      <!-- **************************  CONTENEDOR IZQUIERDO *************************** -->
      <div class="left-container">

        <!-- ----------------------- Pestañas ----------------------- -->
        <div class="tabs">
          <button :class="{'active-tab': activeTab === 'users'}" @click="activeTab = 'users'">USERS</button>
          <button :class="{'active-tab': activeTab === 'channels'}" @click="activeTab = 'channels'">CHANNELS</button>
        </div>

        <!-- ------------------------ Usuarios ---------------------- -->
        <div v-if="activeTab === 'users'">

          <!-- ++++++++ Online +++++++++ -->
          <button class="users-status-button" :class="{'active-button': currentTab === 'conectados'}" 
            @click="currentTab = 'conectados'" title="Online users">----- Online -----</button>
          <div class="between-buttons" v-show="currentTab === 'conectados'">
            <template v-if="onlineUsers && onlineUsers.length >= 1">
              <ul>
                <li v-for="(user, index) in onlineUsers" :key="index" class='user-item-online'>
                  <div class="user-item-left" @click="openChat(user, index)" title="Chat with this user">
                    <span class="user-name" @click="openChat(user, index)" title="Chat with this user">
                      {{ user.username }}
                    </span>
                    <img :class="{ 'message-icon': true, 'visible': chats[user.id].notification }" :src="icons.envelopeIcon" />
                  </div>
                  <div class="user-item-right">
                    <img class="action-icon" :src="icons.profileIcon" @click="viewProfile(user)" 
                      title="View user profile"/>
                    <img v-if="!isUserFriend(user) && !isUserBlocked(user)" 
                      class="action-icon" :src="icons.heartIcon" @click="addFriend(user)" title="Add user as a friend"/>
                    <img v-else class="action-icon invisible" :src="icons.heartIcon" />
                    <img  v-if="!isUserBlocked(user) && !isUserFriend(user)" 
                      class="action-icon" :src="icons.blockIcon" @click="blockUser(user)" title="Block user"/>
                    <img v-else class="action-icon invisible" :src="icons.blockIcon" />
                  </div>
                </li>
              </ul>
            </template>
            <p v-else style="text-align: center;">There are no users connected right now</p>
          </div>

          <!-- ++++++++ Friends +++++++++ -->
          <button class="users-status-button" :class="{'active-button': currentTab === 'amigos'}" 
            @click="currentTab = 'amigos'" title="Show friends">----- Friends -----</button>
          <div class="between-buttons" v-show="currentTab === 'amigos'">
            <template v-if="friends && friends.length > 0">
              <ul>
                <li v-for="(user, index) in friends" :key="index" 
                  :class="{ 'user-item-online': isUserOnline(user), 'user-item': !isUserOnline(user) }">
                  <div class="user-item-left" @click="isUserOnline(user) && openChat(user, index)" 
                    title="Chat with this user">
                    <img v-if="!isUserOnline(user)" :src="icons.redIcon" class="action-icon" 
                      tittle="User offline"/>
                    <img v-else-if="isUserOnline(user) && user.inGame" 
                      :src="icons.orangeIcon" class="action-icon" tittle="User playing"/>
                    <img v-else :src="icons.greenIcon" class="action-icon" tittle="User online"/>
                    <span class="user-name" @click="isUserOnline(user) && openChat(user, index)" 
                      title="Chat with this user">
                      {{ user.username }}
                    </span>
                    <img v-if="isUserOnline(user)" :class="{ 'message-icon': true, 'visible': chats[user.id].notification }" :src="icons.envelopeIcon" />
                  </div>
                  <div class="user-item-right">
                    <img class="action-icon" :src="icons.profileIcon" @click="viewProfile(user)" 
                      title="View user profile"/>
                    <img class="action-icon" :src="icons.unfriendIcon" @click="deleteFriend(user)" 
                      title="Delete user as a friend"/>
                    <img v-if="isUserOnline(user) && user.inGame" class="action-icon" :src="icons.tvIcon" 
                      @click="watchOrRejoinGame(user.id)" title="Watch game"/>
                    <img v-else-if="isUserOnline(user)" class="action-icon" :src="icons.duelIcon" 
                      @click="challengeUser(user)" title="Challenge user"/>
                  </div>
                </li>
              </ul>
              <div class="leyenda">
                <img :src="icons.redIcon" class="status-icon" alt="Offline" /> 
                  <span class="leyenda-text">Offline</span>
                <img :src="icons.greenIcon" class="status-icon" alt="Online" /> 
                  <span class="leyenda-text">Online</span>
                <img :src="icons.orangeIcon" class="status-icon" alt="Playing" /> 
                  <span class="leyenda-text">Playing</span>
              </div>
            </template>
            <p v-else style="text-align: center;">No friends were added yet</p>
          </div>

          <!-- ++++++++ Blocked +++++++++ -->
          <button class="users-status-button" :class="{'active-button': currentTab === 'bloqueados'}" 
            @click="currentTab = 'bloqueados'" title="Show blocked users">----- Blocked -----</button>
          <div class="between-buttons" v-show="currentTab === 'bloqueados'">
            <template v-if="blocked && blocked.length > 0">
              <ul>
                <li v-for="(user, index) in blocked" :key="index" 
                  :class="{ 'user-item-online': isUserOnline(user), 'user-item': !isUserOnline(user) }">
                  <div class="user-item-left">
                    <span class="user-name">
                      {{ user.username }}
                    </span>
                  </div>
                  <div class="user-item-right">
                    <img class="action-icon" :src="icons.profileIcon" @click="viewProfile(user)" 
                      title="View user profile"/>
                    <img class="action-icon" :src="icons.unblockIcon" @click="unblockUser(user)" 
                      title="Unblock user"/>
                  </div>
                </li>
              </ul>
            </template>
            <p v-else style="text-align: center;">No blocked users for now</p>
          </div>
        </div>


        <!-- ----------------------- Canales -------------------------- -->
        <div v-if="activeTab === 'channels'">

          <!-- +++++++ My channels +++++++ -->
          <div class="channels-banner">
            <span>--- My channels ---</span>
          </div>
          <div class="between-banners">
            <ul>
              <li v-for="(channel, index) in myChannels" :key="index" class="channel-item">
                <div class="channel-item-left" @click="!isUserBanned(channel.name) && openChannel(channel, index)" title="Open group chat">
                  <span class="channel-name" @click="!isUserBanned(channel.name) && openChannel(channel, index)" title="Open group chat">
                    {{ channel.name }}
                  </span>
                  <img v-if="!isUserBanned(channel.name)" :class="{ 'message-icon': true, 'visible': channel.chat?.notification }"
                    :src="icons.envelopeIcon" title="There are new messages on this channel"/>
                </div>

                <div class="channel-item-center">
                  <!-- Comprueba si el usuario es el propietario del canal -->
                  <img v-if="channel.owner.id === id" class="role-icon" 
                    :src="icons.ownerIcon" />
                  <!-- Comprueba si el usuario es administrador del canal -->
                  <img v-else-if="channel.admins.find(admin => admin.id === id)" class="role-icon" 
                    :src="icons.adminIcon" />
                  <img v-else class="role-icon invisible" :src="icons.ownerIcon"/>               
                  <img v-show="channel.owner.id === id" class="action-icon" :src="icons.configIcon" 
                    @click="showOwnerConfigModal(channel)" title="Owner channel config"/>
                </div>

                <div v-if="!isUserBanned(channel.name)" class="channel-item-right">
                  <img class="action-icon" :src="icons.infoIcon" @click="showChannelUsersModal(channel)" 
                    title="See group info"/>
                  <img class="action-icon" :src="icons.outIcon" @click="leaveChannel(channel.name)" 
                    title="Leave the channel"/>
                </div>
                <div v-else >Banned</div>
              </li>
            </ul>
          </div>

          <!-- +++++++ Other channels +++++++ -->
          <div class="channels-banner">
            <span>--- Other channels ---</span>
          </div>
          <div class="between-banners">
            <ul>
              <li v-for="(channel, index) in otherChannels" :key="index" class="channel-item">
                <div class="channel-item-left">
                  <span class="channel-name" @click="openChannel(channel, index)">
                    {{ channel.name }}
                  </span>
                  <img :class="{ 'message-icon': true, 'visible': channel.chat?.notification }" :src="icons.envelopeIcon" />
                </div>
                <div class="channel-item-center">
                </div>
                <div class="channel-item-right">
                  <img class="action-icon" :src="icons.inIcon" @click="openChannel(channel, index)" 
                  title="Join channel"/>
                </div>
              </li>
            </ul>
          </div>

          <!-- ++++++ Create Channel button ++++++ -->
          <div class="create-channel-container">
            <button @click="openModal()" class="create-channel-button">+ Create  Channel</button>
          </div>

          <!-- ++++ Emergente create New Channel ++++ -->
          <div v-if="isNewChannelOpen" class="modal">
            <div class="modal-content">
              <button class="close" @click="closeModal">&times;</button>
              <h3>Create New Channel</h3>
              <div>
                <label for="channelName">Channel Name:</label>
                <input type="text" id="channelName" v-model="newChannelName" class="modal-input">
              </div>
              <div>
                <label for="channelName">Channel Password:</label>
                <input type="text" id="password" autocomplete="off" v-model="newChannelPassword" 
                  class="modal-input">
              </div>
              <div class="modal-button-container">
                <button @click="createNewChannel" class="modal-button">Create</button>
              </div>
            </div>
          </div>

          <!-- +++++ Emergente Join Channel +++++ -->
          <div v-if="isJoinChannelOpen" class="modal">
            <div class="modal-content">
              <button class="close" @click="closeJoinModal">&times;</button>
              <div>
                <h3>Do you want to join {{joinChannelName}} channel?</h3>
              </div>
              <div class="pass-input-container">
                <input v-if="isJoinChannelPrivate" type="text" id="joinChannelPassword" autocomplete="off" 
                v-model="joinChannelPassword" placeholder="Password">
              </div>
                <div class="modal-button-container">  
                  <button class="modal-button" @click="joinChannel()">JOIN</button>
              </div>
            </div>
          </div>

          <ChannelUsersModal 
            :channelName="selectedChannelName"
            :channelUsers="usersInSelectedChannel"
            :currentUserRole="currentUserRole"
            :isVisible="isChannelUsersModalVisible"
            @close="hideChannelUsersModal"
          />

          <OwnerConfigModal
            :isVisible="isOwnerConfigModalVisible"
            :channelName="selectedChannelName"
            @close="hideOwnerConfigModal"
          />

        </div>

      </div>

      <!-- **************************  CONTENEDOR DERECHO *************************** -->
      <div class="right-container">

          <div v-if="selectedChat">
            <template v-if="typeof selectedChat.target === 'string'">
              <div class="chat-header">Channel: {{ selectedChat.target }}</div>
            </template>
            <template v-else>
              <div class="chat-header">User: {{ selectedChat.target.username }}</div>
            </template>

            <div class="chat-messages">
              <div v-for="(message, index) in selectedChat.messages" :key="index" class="message">
                <template v-if="typeof selectedChat.target === 'string'">
                  <div :class="{'message-from-user': message.from.id === id, 'message-from-others': message.from.id !== id}">
                    {{message.from.username }}: {{ message.message }}
                  </div>                </template>
                <template v-else>
                  <div :class="{'message-from-user': message.from.id === id, 'message-from-others': message.from.id !== id}">
                    {{ message.message }}
                  </div>                
                </template>
              </div>
            </div>

            <div v-if="typeof selectedChat.target !== 'string' || !isUserMuted(selectedChat.target)" class="chat-input">
              <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Write a message" />
              <button @click="sendMessage">Send</button>
            </div>
            <div v-else class="chat-input">You have been muted</div>

          </div>
          <div v-else>
            <p class="chat-default-message">Select a user or a channel to start chatting.</p>
          </div>
          
      </div>

    </div>
  </div>
</template>

<script>

  import { useRouter } from 'vue-router';
  import { watch } from 'vue';
  import { user } from "../user";
  import { chat } from "../chat";
  import { channel } from "../channel";
  import { spectator } from "../spectator";
  import { game, GameState } from "../game";
  import ChannelUsersModal from "../components/ChannelUsersModal.vue";
  import OwnerConfigModal from "../components/OwnerConfigModal.vue";
  import MainMenu from "../components/MainMenu.vue";
  import logoIcon from '@/assets/logo.png';
  import heartIcon from '@/assets/heart-icon.png';
  import playIcon from '@/assets/play-icon.png';
  import envelopeIcon from '@/assets/envelope-icon.png';
  import removeIcon from '@/assets/remove-icon.png';
  import profileIcon from '@/assets/profile-icon.png';
  import inIcon from '@/assets/in-icon.png';
  import outIcon from '@/assets/out-icon.png';
  import ownerIcon from '@/assets/owner-icon.png';
  import adminIcon from '@/assets/admin-icon.png';
  import groupIcon from '@/assets/group-icon.png';
  import infoIcon from '@/assets/info-icon.png';
  import blockIcon from '@/assets/block-icon.png';
  import unblockIcon from '@/assets/unblock-icon.png';
  import unfriendIcon from '@/assets/unfriend-icon.png';
  import configIcon from '@/assets/config-icon.png';
  import tvIcon from '@/assets/tv-icon.png';
  import duelIcon from '@/assets/duel-icon.png';
  import redIcon from '@/assets/red-icon.png';
  import orangeIcon from '@/assets/orange-icon.png';
  import greenIcon from '@/assets/green-icon.png';

  export default {
    components: {
      MainMenu,
      ChannelUsersModal,
      OwnerConfigModal
    },
    data() {
      return {
        id: user.id,
        onlineUsers: user.usersOnline,
        friends: user.usersFriends,
        blocked: user.usersBlocked,
        chats: chat.chats,
        socket: user.socket,
        selectedChat: null,
        newMessage: "",
        channels: channel.channels,
        isNewChannelOpen: false,
        isJoinChannelOpen: false,
        joinChannelName: "",
        joinChannelPassword: "",
        isJoinChannelPrivate: false,
        newChannelName: "",
        newChannelPassword: "",
        activeTab: 'users',
        currentTab: 'conectados',
        selectedChannelName: '',
        usersInSelectedChannel: [],
        currentUserRole: '',
        isChannelUsersModalVisible: false,
        isOwnerConfigModalVisible: false,
        icons: {
          logoIcon,
          heartIcon,
          envelopeIcon,
          playIcon,
          removeIcon,
          profileIcon,
          inIcon,
          outIcon,
          ownerIcon,
          adminIcon,
          groupIcon,
          infoIcon,
          blockIcon,
          unblockIcon,
          unfriendIcon,
          configIcon,
          duelIcon,
          tvIcon,
          redIcon,
          greenIcon,
          orangeIcon
        },
      };
    },
    async created() {
      watch(() => user.usersOnline, (newVal) => {
          this.onlineUsers = newVal;
      });
      watch(() => user.usersFriends, (newVal) => {
          this.friends = newVal;
      });
      watch(() => user.usersBlocked, (newVal) => {
          this.blocked = newVal;
      });
      watch(() => chat.chats, (newVal) => {
          this.chats = newVal;
      });
      watch(() => channel.channels, (newVal) => {
          this.channels = newVal;
      });
      user.socket?.on('userKicked', (channelName) =>  {
        if (this.selectedChat && this.selectedChat.target === channelName) {
          this.selectedChat = null;
          channel.currentChannelChat = "";
        }
      });
      user.socket?.on('youBanned', (channelName) =>  {
        if (this.selectedChat && this.selectedChat.target === channelName) {
          this.selectedChat = null;
          channel.currentChannelChat = "";
        }
      });
      user.socket?.on('deletedChannelMember', (channelName) =>  {
        if (channel.currentChannelChat === channelName){
          channel.currentChannelChat = "";
          this.selectedChat = null;
        }
      });
    },
    unmounted() {
      chat.currentChat = -1;
      channel.currentChannelChat = "";
    },
    computed: {
      myChannels() {
        return Object.values(channel.channels).filter(c => channel.userIsMemberOfChannel(c.name));
      },
      otherChannels() {
        return Object.values(channel.channels).filter(c => !channel.userIsMemberOfChannel(c.name));
      },
    },
    methods: {
      viewProfile(user) {
        this.$router.push({ name: 'others', params: { id: user.id } });
      },
      sendMessage() {
        if (this.selectedChat && this.newMessage) {
          if (typeof this.selectedChat.target === 'string')
            channel.sendChannelMessage(this.selectedChat.target, this.newMessage);
          else
            chat.sendDirectMessage(this.selectedChat.target.id, this.newMessage);
          this.newMessage = "";
        }
      },
      openChat(userSelected) {
        if (this.chats[userSelected.id]){
          this.selectedChat = this.chats[userSelected.id]
          this.changeFocusChat(userSelected.id);
        }
        else
          this.selectedChat = null;
      },
      openChannel(channelSelected) {
        if (channel.userIsMemberOfChannel(channelSelected.name)) {
          this.selectedChat = channelSelected.chat;
          this.changeFocusChat(channelSelected.name);
        }
        else {
            this.joinChannelName = channelSelected.name;
            this.isJoinChannelOpen = true;
            if (channelSelected.isPrivate)
              this.isJoinChannelPrivate = true;
        }
      },
      changeFocusChat(id) {
        if (typeof id === 'string') {
          chat.currentChat = -1;
          channel.currentChannelChat = id;
        }
        else {
          channel.currentChannelChat = "";
          chat.currentChat = id;
        }
        this.selectedChat.notification = false;
      },
      createNewChannel() {
        if (this.newChannelName){
          channel.createChannel(this.newChannelName, this.newChannelPassword);
          this.closeModal();
        }
      },
      joinChannel() {
        if (this.joinChannelName)
          channel.joinChannel(this.joinChannelName, this.joinChannelPassword);

        this.closeJoinModal();
      },
      leaveChannel(channelName) {
        channel.leaveChannel(channelName)
        if (channel.currentChannelChat === channelName){
			    channel.currentChannelChat = "";
          this.selectedChat = null;
		    }
      },
      addFriend(userSelected) {
        user.addFriend(userSelected.id);
      },
      deleteFriend(userSelected) {
        user.deleteFriend(userSelected.id);
      },
      blockUser(userSelected) {
        user.blockUser(userSelected.id);
      },
      unblockUser(userSelected) {
        user.unblockUser(userSelected.id);
      },
      challengeUser(userSelected) {
        this.$router.push({ name: 'game_config', params: { opponent: userSelected.username, opponentId: userSelected.id} });
      },
      watchOrRejoinGame(userId){
        if (game.state === GameState.Playing) {
          this.$router.push('/competitive');
        } else {
          spectator.findGame(userId);
        }
      },
      isUserMuted(channelName) {
        if (this.channels[channelName]) {
          return this.channels[channelName].usersMuted.find((id) => id === this.id);
        }
        return false;
      },
      isUserBanned(channelName) {
        if (this.channels[channelName]) {
          return this.channels[channelName].usersBanned.find((id) => id === this.id);
        }
        return false;
      },
      isUserOnline(userSelected) {
        return this.onlineUsers.some(onlineUser => onlineUser.id === userSelected.id);
      },
      isUserFriend(userSelected) {
        return this.friends.some(userFriend => userFriend.id === userSelected.id);
      },
      isUserBlocked(userSelected) {
        return this.blocked.some(userBlocked => userBlocked.id === userSelected.id);
      },
      openModal() {
        this.isNewChannelOpen = true;
      },
      openJoinModal() {
        this.isJoinChannelOpen = true;
      },
      closeModal() {
        this.isNewChannelOpen = false;
        this.newChannelName = "";
        this.newChannelPassword = "";
      },
      closeJoinModal() {
        this.isJoinChannelOpen = false;
        this.joinChannelName = "";
        this.joinChannelPassword = "";
        this.isJoinChannelPrivate= false;
      },
      showChannelUsersModal(channelObj) {
        this.selectedChannelName = channelObj.name;
        this.usersInSelectedChannel = channel.getUsersOfChannel(this.selectedChannelName);
        this.isChannelUsersModalVisible = true;
      },
      hideChannelUsersModal() {
        this.isChannelUsersModalVisible = false;
        this.selectedChannelName = '';
        this.usersInSelectedChannel = [];
        this.currentUserRole = '';
      },
      showOwnerConfigModal(channelObj) {
        this.selectedChannelName = channelObj.name;
        this.isOwnerConfigModalVisible = true;
      },
      hideOwnerConfigModal() {
        this.isOwnerConfigModalVisible = false;
        this.selectedChannelName = '';
      },
    },
  };
  </script>
  
 <style scoped>
.chat-page-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  width: 95%;
  height: 600px;
  margin: 30px 0;
}
.left-container {
  flex: 0 0 400px;
  margin: 10px 10px;
  border: 1px solid #ccc;
  height: 578px;
  box-shadow: 5px 5px 4px rgba(0, 0, 0, 0.2); 
}
.right-container {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 400px;
  margin: 10px 10px;
  border: 1px solid #ccc;
  height: 578px;
  box-shadow: 5px 5px 4px rgba(0, 0, 0, 0.2); 
}
.tabs {
  display: flex;
  margin-bottom: 20px;
  border: solid 1px #b8b8b8;
}
.tabs button {
  flex: 1;
  padding: 10px 0;
  border: none;
  cursor: pointer;
}
.tabs button.active-tab {
  background-color: #f1b307;
}
.users-status-button {
  width: 90%;
  margin-inline-end: 20px;
  margin-inline-start: 20px;
  margin-top: 10px;
  padding: 5px 0;
  box-sizing: border-box;
  display: block;
  border: none;
  background-color: #d8d8d8;
  cursor: pointer;
}
.active-button {
  background-color: #999999;
}
.between-buttons {
  max-height: 380px;
  overflow-y: auto;
}
ul {
  padding-inline-start: 20px;
  padding-inline-end: 20px;
}
.user-item {
  display: flex;
  align-items: center; 
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 25px;
  background-color: #ffdede;
}
.user-item-online {
  display: flex;
  align-items: center; 
  margin-bottom: 10px;
  padding: 3px 10px;
  border-radius: 25px;
  background-color:  #d8f6bf;
}
.user-item-left {
  display: flex;
  width: 50%;
  align-items: center;
  justify-content: flex-start;
}
.user-item-right {
  display: flex;
  width: 50%;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.invisible {
  visibility: hidden;
}
.user-name {
  cursor: pointer;
  margin-left: 10px;
}
.message-icon {
  width: 25px;
  height: 25px;
  margin-left: 15px;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.message-icon.visible {
  opacity: 1;
  pointer-events: auto;
}
.action-icon {
  height: 24px;
  cursor: pointer;
}
.channel-item {
  display: flex;
  align-items: center; 
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 25px;
  background-color: #f3f3f3;
}
.channel-item-left {
  display: flex;
  width: 30%;
  align-items: center;
  justify-content: flex-start;
}
.channel-name {
  cursor: pointer;
}
.channel-item-center {
  display: flex;
  width: 45%;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.role-icon {
  height: 22px;
}
.channel-item-right {
  display: flex;
  width: 25%;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.channels-banner {
  width: 90%;
  margin-inline-end: 20px;
  margin-inline-start: 20px;
  margin-top: 10px;
  padding: 5px 0;
  border: none;
  background-color: #999999;
  text-align: center;
}
.between-banners {
  height: 190px;
  overflow-y: auto;
}
.create-channel-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
.create-channel-button {
  width: 70%;
  padding: 3px 0;
  align-items: center;
}
.chat-header {
  height: 28px;
  padding: 10px 20px;
  background-color: #f1b307;
  font-size: 20px;
  font-weight: bold;
}
.chat-messages {
  height: 480px;
  overflow-y: auto;
}
.chat-input {
  display: flex;
  height: 30px;
  padding: 10px;
  flex-shrink: 0;
}
.chat-input input {
  flex-grow: 1;
  margin-right: 10px;
}
.chat-default-message {
  padding:50px 0;
  text-align: center;
  font-weight: bold;
}
.channel-message {
  font-weight: lighter;
}
.message-from-user {
  color: #111111;
  font-weight: bold;
  text-align: right;
  border-radius: 15px;
  padding: 5px 10px;
  margin: 5px 0;
}
.message-from-others {
  color: #e0a500;
  font-weight: bold;
  text-align: left;
  border-radius: 15px;
  padding: 5px 10px;
  margin: 5px 0;
  display: inline-block;
}
.modal {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
}
.modal-content {
  background-color: #f1b307;
  padding: 30px;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.close {
  position: absolute;
  top: 0px;
  right: 0px;
  cursor: pointer;
} 
.modal-input {
  display: block;
  margin: 2px 0 15px 0;
}
.pass-input-container  {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-button-container {
  display: flex;
  justify-content: center;
  padding: 10px;
  margin-top: 20px;
}

@media (max-width: 818px) { 
  .tab-container, .chat-panel-container {
    flex-basis: 100%;
  }
}

.leyenda {
  text-align: center;
  padding: 10px;
  margin-top: 20px;
}

.leyenda-text {
  margin-right: 25px;
  font-size: 0.7rem;
}

.status-icon {
  width: 20px;
  vertical-align: middle;
  margin-right: 4px;
}
</style>
