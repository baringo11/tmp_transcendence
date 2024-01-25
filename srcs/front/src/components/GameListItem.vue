<template>
  <div class="game-item">
    <span>{{ game.player1 }} vs {{ game.player2 || '???' }}</span>
    <span>{{ game.level }}</span>
    <span>{{ game.winningScore }}</span>
    <span>{{ game.status }}</span>
    <span v-if="isCurrentUserPlayer1 && game.status === 'waiting'">
      <button @click="quitGame">Quit</button>
    </span>
    <span v-else-if="game.status === 'waiting'">
      <button @click="joinGame">Join</button>
    </span>
    <button v-else @click="watchGame">Watch</button>
  </div>
</template>

<script lang="ts">
  import { defineComponent, computed, emit } from 'vue';

  export default defineComponent({
    props: {
      game: Object,
      currentUsername: String
    },
    setup(props, { emit }) {
      const isCurrentUserPlayer1 = computed(() => {
        return props.game.player1 === props.currentUsername;
      });

      const joinGame = () => {
        emit('joinGame', props.game.id);
      };

      const watchGame = () => {
        emit('watchGame', props.game.id);
      };

      const quitGame = () => {
        // Lógica para abandonar el juego
        // Por ejemplo, emitir un evento o llamar a una API
      };

      return { joinGame, watchGame, quitGame, isCurrentUserPlayer1 };
    }
  });
</script>

<style scoped>
.game-item {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* Cinco columnas para cinco elementos */
  align-items: center;
  background-color: #f4f4f4; /* Color de fondo para los elementos de la lista */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 10px;
  margin: 10px 0;
  gap: 10px;
}

.game-item > * {
  display: flex;
  justify-content: center;
  align-items: center;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f1b307;
  color: white;
  transition: background-color 0.3s;
  width: 100%;
}

button:hover {
  background-color: #f1b307b7;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>