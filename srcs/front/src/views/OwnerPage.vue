<template>
  <MainMenu />
  <div class="main-frame">
    <h2>Web moderation panel</h2>
    <div class="main-container">
      <div class="tabs">
        <button :class="{ active: activeTab === 'users' }" 
          @click="activeTab = 'users'">Registered users</button>
        <button :class="{ active: activeTab === 'channels' }" 
          @click="activeTab = 'channels'">Chat Channels</button>
      </div>
      <div class="content">
        <div v-if="activeTab === 'users'" class="user-list-container">
          <ul>
            <li v-for="usuario in users" :key="usuario.id" class="list-item">
              <div class="name-section">
                <span class="username">{{ usuario.username }}</span>
                <img v-if="usuario.role === 'owner'" :src="webOwnerIcon" class="role-icon" />
                <img v-else-if="usuario.role !== 'owner' && usuario.role === 'admin'" 
                  :src="moderatorIcon" class="role-icon" />
              </div>
              <div class="button-section">
                <button v-if="!usuario.isBanned && isUser(usuario)" class="action-button" 
                  @click="banUser(usuario)">Ban user</button>
                <button v-else-if="usuario.isBanned && isUser(usuario)" class="action-button" 
                  @click="unbanUser(usuario)">Unban user</button>
                <button v-if="iAmOwner && !isAdmin(usuario) && isUser(usuario)" class="action-button" 
                  @click="makeModerator(usuario)">Make moderator</button>
                <button v-else-if="iAmOwner && isAdmin(usuario)" class="action-button" 
                  @click="removeModerator(usuario)">Remove moderator</button>             
              </div>
            </li>
          </ul>
        </div>
        <div v-if="activeTab === 'channels'">
          <ul>
            <li v-for="canal in channelList" :key="canal.name" class="list-item">
              <span class="channel-name">{{ canal.name }}</span>
              <div class="button-section">
                <button class="channel-action-button" @click="deleteChannel(canal.name)">Destroy</button>
                <button class="channel-action-button" @click="showChannelUsersWebOwnerModal(canal)">See users</button>
                <button class="channel-action-button" @click="showChatModal(canal.name)">See Chat</button>
              </div>
            </li>
          </ul>
        </div>
        <ChannelUsersWebOwnerModal
          :isVisible="isModalVisible"
          :channelName="selectedChannelName"
          @close="isModalVisible = false; selectedChannelName = ''"
        />
        <SeeChatModal
          :isVisible="isChatModalVisible"
          :channelName="selectedChannelForChat"
          @close="isChatModalVisible = false; selectedChannelForChat = ''"
        />
      </div>
    </div>  
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';
import MainMenu from "@/components/MainMenu.vue";
import { user } from "../user";
import { channel } from "../channel";
import ChannelUsersWebOwnerModal from "@/components/ChannelUsersWebOwnerModal.vue";
import SeeChatModal from "@/components/SeeChatModal.vue";
import { UserData } from '../interfaces';
import { UserRole } from '@/interfaces/user-data.interface';
import webOwnerIcon from '@/assets/web-owner-icon.png';
import moderatorIcon from '@/assets/moderator-icon.png';

export default {
  name: 'OwnerPage',
  components: {
    MainMenu,
    ChannelUsersWebOwnerModal,
    SeeChatModal
  },
  setup() {
    const activeTab = ref('users');
    const users = ref<UserData[]>([]);
    const channelList = computed(() => Object.values(channel.channels));
    const isModalVisible = ref(false);
    const selectedChannelName = ref('');
    const isChatModalVisible = ref(false);
    const selectedChannelForChat = ref('');
    const iAmOwner: boolean = user.role === UserRole.OWNER;

    onMounted(() => {
      user.socket?.on('connected', () => {
        fetchUsers();
			});
  	});

    async function fetchUsers() {
      try {
        let allUsers = await user.getUsers();
        const fetchedUsers = allUsers?.filter((u) => u.id != user.id);
        if (fetchedUsers) {
          users.value = fetchedUsers;
        }
      } catch (e) {
        console.error(e);
      }
    }

    function isAdmin(usuario: UserData) {
      return usuario.role === UserRole.ADMIN;
    };

    function isUser(usuario: UserData) {
      return usuario.role === UserRole.USER;
    };

    function makeModerator(usuario: UserData) {
      user.makeWebsiteAdmin(usuario);
      const index = users.value.findIndex(user => user.id === usuario.id);
      if (index !== -1)
        users.value[index].role = UserRole.ADMIN;
    };

    function removeModerator(usuario: UserData) {
      user.removeWebsiteAdmin(usuario);
      const index = users.value.findIndex(user => user.id === usuario.id);
      if (index !== -1)
        users.value[index].role = UserRole.USER;
    };

    function banUser(usuario: UserData) {
      user.banFromWebsite(usuario);
      const index = users.value.findIndex(user => user.id === usuario.id);
      if (index !== -1)
        users.value[index].isBanned = true;
    };

    function unbanUser(usuario: UserData) {
      user.unbanFromWebsite(usuario);
      const index = users.value.findIndex(user => user.id === usuario.id);
      if (index !== -1)
        users.value[index].isBanned = false;
    };

    const showChatModal = (channelName) => {
      selectedChannelForChat.value = channelName;
      isChatModalVisible.value = true;
    };

    const showChannelUsersWebOwnerModal = (channel) => {
      selectedChannelName.value = channel.name;
      isModalVisible.value = true;
    };

    const deleteChannel = (channelName) => {
      channel.deleteChannel(channelName);
    };

    onMounted(() => {
      fetchUsers();
    });

    return {  activeTab, 
              users, 
              channelList, 
              isModalVisible, 
              selectedChannelName, 
              showChannelUsersWebOwnerModal,
              deleteChannel,
              isChatModalVisible,
              selectedChannelForChat,
              showChatModal,
              makeModerator,
              removeModerator,
              banUser,
              unbanUser,
              isAdmin,
              isUser,
              iAmOwner,
              webOwnerIcon,
              moderatorIcon
    };
  },
};
</script>

<style scoped>
.tabs {
  display: flex;
  justify-content: center;
  background-color: #f9f9f9;
  gap: 20px;
}
.tabs button {
  flex: 1;
  margin: 0;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  background-color: #f1b307;
  color: white;
  cursor: pointer;
}
.tabs button.active {
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.5); 
  background-color: #f1b307;
}
.tabs button:hover {
  background-color: #f1b307de;
}
.main-container {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  padding: 20px;
  min-width: 450px;
  min-height: 500px;

}
.content {
  width: 95%;
}
.content ul {
  list-style-type: none;
  padding: 0;
  margin-top: 30px;
}
.content li {
  display: flex;
  align-items: center;
  padding: 6px 15px 6px 10px;
  border-radius: 25px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
.content li:not(:last-child) {
  margin-bottom: 10px;
}
 .user-list-container {
  max-height: 600px; 
  overflow-y: auto;
} 

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
}
.name-section {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.username, .channel-name {
  font-size: 18px;
}
.role-icon {
  height: 22px; /* Altura fija para el ícono */
  margin-left: 10px; /* Espacio entre el nombre y el ícono */
}
.button-section {
  display: flex;
}
.action-button {
  border-color: #f9f9f9;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  width: 140px;
  margin-left: 3px;
}
.action-button:hover {
  background-color: #e6a00f;
  color: white;
  transform: scale(1.05);
}


.channel-action-button {
  border-color: #f9f9f9;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  width: 100px;
  margin-left: 3px;
}
.channel-action-button:hover {
  background-color: #e6a00f;
  color: white;
  transform: scale(1.05);
}


.modal {
  position: fixed; /* Posicionamiento fijo en toda la pantalla */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo semitransparente */
  z-index: 1000; /* Alto z-index para estar por encima de otros elementos */
}
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  /* Ajusta el tamaño y más estilos según tus necesidades */
}
</style>