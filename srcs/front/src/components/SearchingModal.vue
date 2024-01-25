<!-- src/components/SearchingModal.vue -->
<template>
    <teleport to="body">
      <div class="modal-overlay">
        <div class="modal-content">
          <img src="../assets/loadingGif.gif" alt="Loading" class="loading-gif"/>
          <p v-if="!props.username">Searching for an opponent...</p>
          <p v-else>Waiting for user '{{ props.username }}' to accept the challenge</p>
          <button v-if="!props.username" @click="cancelSearch" class="cancel-button">Cancel</button>
          <button v-else @click="cancelChallenge" class="cancel-button">Cancel challenge</button>
        </div>
      </div>
    </teleport>
  </template>
  
  <script setup>
  import { user } from "../user";

  const props = defineProps(["username", "userId"]);
  
  function cancelSearch() {
    user.socket?.emit('cancel-search');
  } 

  function cancelChallenge() {
    user.socket?.emit('cancel-challenge', props.userId);
  }

  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(212, 212, 212, 0.6); /* Fondo semi-transparente */
  }
  
  .modal-content {
    display: flex;
    align-items: center;
    justify-content: space-around; /* Esto distribuirá el espacio entre los elementos de manera uniforme */
    /* background: #fff; */
    padding: 10px 20px;
    border-radius: 10px;
    /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); */
  }
  
  .loading-gif {
    /* Ajusta el tamaño del GIF según sea necesario */
    max-width: 50px;
    margin-right: 20px; /* Espacio entre el GIF y el mensaje */
  }
  
  .searching-message {
    margin-right: 50px; /* Espacio entre el mensaje y el botón */
  }
  
  .cancel-button {
    margin-left: 30px;
    border-radius: 5px;
    cursor: pointer;
  }
  </style>