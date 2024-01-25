<template>
  <MainMenu />
  <div class="main-frame">
    <div id="pong-game">
      <div class="game-settings" :class="{'small-font': false}">
        <span class="level">LEVEL: {{ gameLevel }}</span>
        <span class="winning-score">WINNING SCORE: {{ gameWinningScore }}</span>
      </div>
      <div class="score-board">
        <div class="player-info" :class="{'small-font': false}">
          <span class="player-name">{{ scoreBoard.user1Name }}</span>
          <span class="player-score">{{ scoreBoard.user1Score }}</span>
        </div>
        <div v-if="gameEnded" class="popup">
          <div class="popup-content">
            <h2>WINNER: {{ gameWinner }}</h2>
            <router-link to="/game-config" class="button">OK</router-link>
          </div>
        </div>
        <div class="ia-info" :class="{'small-font': false}">
          <span class="ai-name">{{ scoreBoard.user2Name }}</span>
          <span class="ai-score">{{ scoreBoard.user2Score }}</span>
        </div>
      </div>
      <div class="game-container">
        <canvas ref="pongCanvas"></canvas>
        <!-- <button v-if="!gameStarted" class="start-button" @click="startGame">START</button> -->
      </div>
      <div class="interrupt-container">
        <button class="button" @click="quitGame">Quit game</button>
      </div> 
    </div>
  </div>
</template>
  
<script lang="ts">
  
  import { defineComponent, onMounted, onBeforeUnmount, ref, reactive, computed, onBeforeMount } from "vue";
  import MainMenu from "../components/MainMenu.vue";
  import { useRouter } from "vue-router";
  import { GameState, game } from "../game";
  import { user } from "../user";

  export default defineComponent({
    components: {
      MainMenu,
    },
    setup() {
      // Propiedades estáticas
      const router = useRouter();
      const gameLevel: string = game.gameCustomization.gameDifficult;
      const gameWinningScore: number = game.gameCustomization.winningScore;
      const difficultyMultiplier = gameLevel === 'hard' ? 1.9 : 1;

      // Propiedades reactivas
      const pongCanvas = ref<HTMLCanvasElement | null>(null);
      const gameStarted = ref(false);
      const gameEnded = ref(false);
      const gameWinner = ref('');
      const scoreBoard = ref(game.scoreBoard);

      const quitGame = () => {

        user.socket?.emit('end-game-prematurely');
        router.push('/game-config');
      };

      onMounted(() => {
        window.addEventListener('resize', (event) => {

        });
        user.socket?.on('end-game', (payload) =>  {
          if (payload === 1)
            gameWinner.value = user.username;
          else {
            if (user.username === scoreBoard.value.user1Name)
              gameWinner.value = scoreBoard.value.user2Name;
            else
              gameWinner.value = scoreBoard.value.user1Name;
          }
          gameEnded.value = true;
          game.endGame();
        });

        user.socket?.on('update-game', (payload) =>  {
          const bx = payload.ball.x;
          const by = payload.ball.y;
          const paddle1 = payload.paddles[0];
          const paddle2 = payload.paddles[1];
          const ballSize = payload.ball.size;
          scoreBoard.value.user1Score = payload.score[0];
          scoreBoard.value.user2Score = payload.score[1];
          if (pongCanvas.value) {
            const canvas = pongCanvas.value;
            const ctx = canvas.getContext('2d');
            // Actualiza tamaño de canvas en el DOM
            canvas.width = 800;
            canvas.height = 800 / 2;
            if (ctx) {
              // Pinta las palas
               ctx.clearRect(0, 0, canvas.width, canvas.height);
               ctx.fillStyle = 'white';
               ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
               ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
              // Pinta la pelota
              ctx.beginPath();
              ctx.arc(bx, by, ballSize, 0, Math.PI * 2);
              ctx.fillStyle = 'white';
              ctx.fill();
              ctx.closePath();
            }
          }
        });
      });

      return { pongCanvas, gameLevel, gameWinningScore, gameStarted, gameEnded, gameWinner, difficultyMultiplier, scoreBoard, quitGame };
    },
  });

</script>

<style scoped>
#pong-game {
  position: relative; /* Se asegura de que el contenedor sea el contexto para el posicionamiento absoluto */
  max-width: 800px; /* Establece el ancho del contenedor para que coincida con el del canvas */
  margin: auto; /* Centra el juego horizontalmente */
}

.game-container {
    background: #000000;
    position: relative; /* Se usa para posicionar absolutamente el botón de inicio dentro de este contenedor */
    margin-bottom: 20px;
}

.game-settings {
    display: flex;
    justify-content: center; /* Separa los elementos a los extremos */
    background: #fdfdfd;
    text-align: center;
    margin-top: 20px;
    padding: 10px 0 2px 0; /* Añade espacio alrededor de los puntajes */
    height: 35px;
}

.level, .winning-score {
  /* Estilos para los nombres de los jugadores */
  font-weight: bold;
  font-size: 22px;
  padding: 0 20px;
  color: #000000; /* Ejemplo de color */
}

.small-font .level,
.small-font .winning-score {
  font-size: 18px; /* Tamaño de fuente más pequeño para el canvas pequeño */
}

.score-board {
    display: flex;
    justify-content: space-between; /* Separa los elementos a los extremos */
    background: #f1b307;
    text-align: center;
    padding: 5px 10px 10px 10px; /* Añade espacio alrededor de los puntajes */
    margin-bottom: 0px;
    height: 35px;
}

.player-name, .ai-name {
  /* Estilos para los nombres de los jugadores */
  font-weight: bold;
  font-size: 25px;
  padding: 0 15px;
  color: #000000; /* Ejemplo de color */
}

.player-score, .ai-score {
  /* Estilos para las puntuaciones de los jugadores */
  padding: 0 15px;
  font-size: 35px;
  font-weight: bold;
  color: #ffffff; /* Ejemplo de color */
}

.small-font .player-name,
.small-font .ai-name {
  font-size: 18px; /* Tamaño más pequeño para el canvas pequeño */
}

.small-font .player-score,
.small-font .ai-score {
  font-size: 28px; /* Tamaño más pequeño para el canvas pequeño */
}

.start-button {
  position: absolute; /* Posiciona el botón absolutamente dentro del contenedor de juego */
  top: 50%; /* Centra el botón en la mitad del contenedor */
  left: 50%; /* Centra el botón en la mitad del contenedor */
  transform: translate(-50%, -50%); /* Ajusta la posición exacta del botón para que esté centrado */
  padding: 10px 20px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  z-index: 10; /* Asegúrate de que el botón esté sobre el canvas */
}

.interrupt-container {
    text-align: center; /* Esto asegura que el botón dentro del contenedor esté centrado */
}

.button {
    font-size: 18px;
}

.popup {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000; /* Un valor alto para asegurar que esté en la parte superior */
}

.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: auto;
  max-width: 90%;
}
</style>