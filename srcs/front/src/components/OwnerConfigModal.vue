<template>
    <div class="modal" v-if="isVisible">
      <div class="modal-content">
  
        <!-- Cabecera (titulo y boton de cerrar) -->
        <div class="modal-header">
          <button class="close-modal" @click="closeModal">&times;</button>
          <span class="modal-title">Channel configuration</span>
        </div>
        
        <!-- Cuerpo del modal -->
        <div class="modal-body">
        
          <!-- Botón para borrar el canal -->
          <div class="delete-channel-container">     
            <span class="delete-channel-title">Delete channel</span>
            <span class="delete-channel-text">If you press the delete button, everyone will be kick out <br>and the channel will be deleted</span>
            <button class="delete-channel-button" @click="deleteChannel">Delete</button>
          </div>

          <hr class="modal-divider" />

          <!-- Cambiar password del canal -->
          <div class="change-password-container"> 
            <span class="change-password-title">Update password</span>
          <div class="change-password-inputbox">
              <label for="newPassword" class="change-password-label">New password:</label>
              <input type="password" id="newPassword" v-model="newPassword">
          </div>  
          <button v-if="newPassword.length > 0" class="change-password-button" @click="updatePassword">Change Password</button>
          <button v-else-if="currentChannel && currentChannel.isPrivate" class="change-password-button" @click="updatePassword">Delete Password</button>
          </div>
        </div>
    </div>
  </div>
</template>

<script>

import { watch } from 'vue';
import { channel } from '../channel.ts';

export default {
  name: "OwnerConfigModal",
  props: {
    isVisible: Boolean,
    channelName: String,
  },
  data() {
    return {
      newPassword: '',
      currentChannel: null,
    };
  },
  created() {
    watch(() => this.channelName, (newVal) => {
      this.newPassword = '';
      this.currentChannel = channel.channels[newVal];
    });
  },
  methods: {
    closeModal() {
        this.$emit('close');
    },
    deleteChannel() {
      channel.deleteChannel(this.channelName);
      this.closeModal();
    },
    updatePassword() {
      if (this.newPassword)
        channel.setPassword(this.newPassword, this.channelName);
      else
        channel.unsetPassword(this.channelName);
      this.newPassword = '';
      this.closeModal();
    },
  } 
};
</script>

<style scoped>
.modal {
  /* Estilos para la ventana modal */
}
.modal-content {
  position: relative;
  width: 700px;
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
.modal-title {
  font-size: 28px;
  font-weight: bold;
  margin-top: 40px;
  margin-bottom: 35px;
  padding: 5px 50px;
  background-color: #f1b307;
}
.delete-channel-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 50px;
  /* border: solid 1px #000000;
  border-radius: 20px; */
  /* height: 100px; */
}
.delete-channel-title {
  font-size: 20px;
  font-weight: bold;
}
.delete-channel-text {
  text-align: center;
  padding: 10px 0 15px 0;
}
.delete-channel-button {
  background-color: rgb(148, 148, 148);
  color: white;
  font-weight: bold;
  padding: 5px 20px;
  border:solid 1 #000000;
  border-radius: 8px;
  cursor: pointer;
  /* height: 30px; */
}
.modal-divider {
  height: 1px;
  background-color: #ccc;
  width: 80%;
  margin: 35px auto 25px auto;
}
.change-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
}
.change-password-title {
  font-size: 20px;
  font-weight: bold;
}
.change-password-inputbox {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 20px 50px 25px 50px;
}
.change-password-label {
  margin-right: 10px;
}
.change-password-button {
  background-color: rgb(148, 148, 148);
  color: white;
  font-weight: bold;
  padding: 5px 20px;
  border:solid 1 #000000;
  border-radius: 8px;
  cursor: pointer;}
</style>