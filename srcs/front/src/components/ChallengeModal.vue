<template>
    <teleport to="body">
      <div class="modal-overlay">
        <div class="modal-content">
          <img src="../assets/loadingGif.gif" alt="Loading" class="loading-gif"/>
          <div>YOU HAVE BEEN CHALLENGED by the user: '{{ props.fromUsername }}'</div>
          <div>Game level: {{ props.gameCustomization.gameDifficult }}</div>
          <div>Game winning score: {{ props.gameCustomization.winningScore }}</div>
          <button @click="acceptChallenge" class="cancel-button">ACCEPT</button>
          <button @click="refuseChallenge" class="cancel-button">REFUSE</button>
        </div>
      </div>
    </teleport>
  </template>
  
  <script setup>
  import { user } from "../user";
  import { game } from "../game";

  const props = defineProps(["fromUsername", "fromUserId", "gameCustomization"]);
  
  function acceptChallenge() {
    game.gameCustomization = props.gameCustomization;
    user.socket?.emit('accept-challenge', {toUserId: props.fromUserId, gameCustomization: props.gameCustomization});
  }

  function refuseChallenge() {
    user.socket?.emit('refuse-challenge', props.fromUserId);
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