<template>
    <div class="modal" v-if="isVisible">
      <div class="modal-content">
  
        <!-- Cabecera (titulo y boton de cerrar) -->
        <div class="modal-header">
          <button class="close-modal" @click="closeModal">&times;</button>
          <span class="modal-tittle">Users in "{{ channelName }}" channel</span>
        </div>
        
        <!-- Cuerpo del modal -->
        <div class="modal-body">
          <div class="user-row" v-for="(user, index) in channelUsers" :key="index"
            :class="{ 'user-item-online': isUserOnline(user), 'user-item': !isUserOnline(user) }">
            <div class="user-name-space">
              <span class="user-name">{{ user.username }}</span>
            </div>
  
            <div class="user-role">
              <img v-if="isOwner(user)" class="role-icon" :src="icons.ownerIcon" />
              <img v-else-if="isAdmin(user)" class="role-icon" :src="icons.adminIcon" />
              <img v-else class="role-icon invisible" :src="icons.adminIcon" />
            </div>

            <div v-if="!isYou(user)" class="owner-admin-actions"><!-- Botones para owner y admin -->
              <img v-show="!isAdmin(user) && !isBanned(user)" 
                class="action-icon" :src="icons.kickIcon" @click="kickUserFromChannel(user)" title="Kick user from channel"/>
              <img v-if="!isAdmin(user) && !isMuted(user) && !isBanned(user)" 
                class="action-icon" :src="icons.muteIcon" @click="muteUser(user)" title="Mute user" />
              <img v-else-if="!isAdmin(user) && isMuted(user) && !isBanned(user)" 
                class="action-icon" :src="icons.unmuteIcon" @click="unmuteUser(user)" title="Unmute user" />
              <img v-else class="action-icon invisible" :src="icons.muteIcon" />
  
              <img v-if="!isAdmin(user) && !isBanned(user)" 
                class="action-icon" :src="icons.banIcon" @click="banUser(user)" title="Ban user" />
              <img v-else-if="!isAdmin(user) && isBanned(user)" 
                class="action-icon" :src="icons.unbanIcon" @click="unbanUser(user)" title="Unban user" />
              <img v-else class="action-icon invisible" :src="icons.banIcon" />
            </div>
  
            <div class="owner-actions"><!-- Botones exclusivos del owner -->
              <button v-if="!isOwner(user) && !isAdmin(user) && !isYou(user) && !isBanned(user)" 
                class="promotion-button" @click="promoteToAdmin(user)" 
                title="Promote user to Admin">Make Admin
              </button>
              <button v-else-if="!isOwner(user) && isAdmin(user) && !isYou(user) && !isBanned(user)"
                class="promotion-button" @click="removeFromAdmin(user)" 
                title="Remove user from Admin">Remove Admin
              </button>
              <button v-else class="promotion-button invisible">
              </button>
            </div>
  
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
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
    import addIcon from '@/assets/add-icon.jpg';
    import kickIcon from '@/assets/kick-icon.png';
    import muteIcon from '@/assets/mute-icon.png';
    import unmuteIcon from '@/assets/unmute-icon.png';
    import unfriendIcon from '@/assets/unfriend-icon.png';
    import banIcon from '@/assets/ban-icon.png';
    import unbanIcon from '@/assets/unban-icon.png';
    import blockIcon from '@/assets/block-icon.png';
    import unblockIcon from '@/assets/unblock-icon.png';
    import { channel } from '../channel.ts';
    import { user } from '../user.ts';
    import { watch } from 'vue';
  
  export default {
    name: "ChannelUsersWebOwnerModal",
    props: {
      isVisible: Boolean,
      channelName: String,
    },
    data() {
      return {
        myself: user,
        currentChannel: null,
        channelUsers: [],
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
          addIcon,
          kickIcon,
          muteIcon,
          unmuteIcon,
          unfriendIcon,
          banIcon,
          unbanIcon,
          blockIcon,
          unblockIcon
        },
      };
    },
    created() {
      watch(() => this.channelName, (newVal) => {
        user.socket?.emit('getChannelForModerator', newVal);
      });
      user.socket?.on('channelForModerator', (channel) =>  {
        if (channel.name === this.channelName) {
          this.currentChannel = channel;
          this.channelUsers = channel.users;
        }
      });
      user.socket?.on('channelUpdateForModerator', (channel) =>  {
        if (channel.name === this.channelName) {
          this.currentChannel = channel;
          this.channelUsers = channel.users;
        }
      });
      watch(() => this.myself, (newVal) => {
        this.myself = newVal;
      });
    },
    methods: {
      viewProfile(user) {
        this.$router.push({ name: 'others', params: { id: user.id } });
      },
      promoteToAdmin(userSelected) {
        channel.makeChannelAdmin(userSelected, this.channelName);
      },
      removeFromAdmin(userSelected) {
        channel.removeChannelAdmin(userSelected, this.channelName);
      },
      challengeUser(userSelected) {
        this.$router.push({ name: 'game_config', params: { opponent: userSelected.username, opponentId: userSelected.id } });
      },
      isOwner(userSelected) {
        if (this.currentChannel)
          return this.currentChannel.owner.id === userSelected.id;
        return false;
      },
      isAdmin(userSelected) {
        if (this.currentChannel)
          return channel.userIsChannelAdmin(this.currentChannel, userSelected);
        return false;
      },
      kickUserFromChannel(userSelected) {
        if (this.currentChannel && !this.isAdmin(userSelected))
          channel.kickUser(userSelected, this.channelName);
      },
      muteUser(userSelected) {
        if (this.currentChannel && !this.isAdmin(userSelected) && !this.isMuted(userSelected))
          channel.muteUser(userSelected, this.channelName);
      },
      unmuteUser(userSelected) {
        if (this.currentChannel && !this.isAdmin(userSelected) && this.isMuted(userSelected))
          channel.unmuteUser(userSelected, this.channelName);
      },
      banUser(userSelected) {
        if (this.currentChannel && !this.isAdmin(userSelected) && !this.isBanned(userSelected))
          channel.banUser(userSelected, this.channelName);
      },
      unbanUser(userSelected) {
        if (this.currentChannel && !this.isAdmin(userSelected) && this.isBanned(userSelected))
          channel.unbanUser(userSelected, this.channelName);
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
      isMuted(userSelected) {
        if (this.currentChannel)
            return this.currentChannel.usersMuted.find((id) => id === userSelected.id);
        return false;
      },
      isBanned(userSelected) {
        if (this.currentChannel)
            return this.currentChannel.usersBanned.find((id) => id === userSelected.id);
        return false;
      },
      isYou(userSelected) {
        return user.id === userSelected.id;
      },
      isUserOnline(userSelected) {
        if (this.myself)
          return this.myself.usersOnline.some(onlineUser => onlineUser.id === userSelected.id);
        return false;
      },
      isUserFriend(userSelected) {
        if (this.myself)
          return this.myself.usersFriends.some(userFriend => userFriend.id === userSelected.id);
        return false;
      },
      isUserBlocked(userSelected) {
        if (this.myself)
          return this.myself.usersBlocked.some(userBlocked => userBlocked.id === userSelected.id);
        return false;
      },
      closeModal() {
        this.$emit('close');
      }
    }
  };
  </script>
  
  <style scoped>
  .modal {
    /* Estilos para la ventana modal */
  }
  .modal-content {
    position: relative;
    width: 450px;
    height: 500px;
    background-color: rgb(255, 255, 255);
  }
  .modal-header {
    display: flex;
    justify-content: center;
    position: relative;
  }
  .close-modal {
    position: absolute;
    top: 5px;
    right: 5px;
    border: solid 2px #464545;
    background-color: #c7c7c7;
    font-size: 1em;
    cursor: pointer;
  }
  .modal-tittle {
    font-size: 25px;
    font-weight: bold;
    margin-top: 40px;
    margin-bottom: 35px;
    padding: 5px 50px;
    background-color: #f1b307;
  }
  .modal-body {
    /* Estilos para el cuerpo del modal, si son necesarios */
  }
  .user-row {
    display: flex;
    align-items: center; 
    margin: 0 20px 10px 20px;
    padding: 5px 10px;
    border-radius: 25px;
    background-color: #ebebeb;
  }
  .user-name-space {
    flex: 15%;
  }
  .user-role {
    flex: 10%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .user-actions {
    flex: 30%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
  }
  .owner-admin-actions {
    flex: 35%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
  }
  .owner-actions {
    flex: 25%; 
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .promotion-button {
    font-size: 13px;
    border-radius: 5px;
    border-color: #b4b4b4;
    cursor: pointer;
  }
  .role-icon {
    height: 22px;
  }
  .invisible {
    visibility: hidden;
  }
  .action-icon {
    height: 24px;
    cursor: pointer;
  }
  </style>