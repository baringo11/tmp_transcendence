<template>
  <MainMenu />
  <div class="main-frame">

    <h2 class="tittle">Select game preferences:</h2>
    
    <!-- Toggle Switch para Nivel de Juego -->
    <div class="level-toggle">
      <span>Easy</span>
      <label class="switch">
        <input type="checkbox" v-model="checkboxState" name="gameLevel">
        <span class="slider round"></span>
      </label>
      <span>Hard</span>
    </div>
    
    <!-- Menú Desplegable para Puntos -->
    <div class="dropdown-menu">
      <label class="label" for="score-select">Winning score:</label>
      <select v-model="winningScore" id="score-select">
        <option v-for="score in scores" :key="score" :value="score">{{ score }}</option>
      </select>
    </div>

    <!-- Botones de crear partida -->
    <div class="button-container">
      <button v-if="!opponent" class="button" @click="startPractice()">Practice (1 player)</button>
      <button v-if="!opponent" class="button" @click="createGameOnServer()">Search opponent</button>

      <div class="challenge-container">
        <button v-if="opponent" class="button" @click="createPrivateMatch">Challenge {{ opponent }}</button>
        <div v-if="friendship === false" class="error-message">
          Opponent should accept you as a friend before you can challenge him.
        </div>
        <div v-else-if="opponentInGame === true" class="error-message">
          Opponent is already in a game.
        </div>
      </div>


    </div>
    <router-link to="/rules" class="rules">Read game's rules</router-link>
  </div>
</template>
  
<script lang="ts">
  import { defineComponent, ref, onMounted, reactive, toRefs } from "vue";
  import MainMenu from "../components/MainMenu.vue";
  import { useRouter, useRoute } from "vue-router";
  import { game } from "../game";
  import { user } from "../user";
  import type { GameCustomization } from "../interfaces";
  import { spectator } from "../spectator";
  
  export default defineComponent({
    name: "GameConfig",
    components: {
      MainMenu,
    },
    props: {
      opponent: {
        type: String,
        default: ''
      },
      opponentId: {
        type: Number,
        default: -1
      }
    },
    setup(props) {
      const router = useRouter();
      const checkboxState = ref(false);
      const scores = ref([3, 4, 5, 6, 7]);
      const winningScore = ref(5);
      const route = useRoute(); // quitar. solo para una prueba. quitar tambien del import
      const friendship = ref(true);
      const opponentInGame = ref(false);

      // Resetear el estado de game cuando el componente se monte
      onMounted(() => {
        resetGameState();
      });

      function resetGameState() {
        game.updatePlayer1('');
        game.updatePlayer2('');
        game.updateGameIsCompetitive(false);
        game.updateGameLevel('Easy');
        game.updatePointsToWin(3);
        game.updatePoints(0, 0);
        game.updateWinner('');
      }

      const startPractice = () => {
        game.updatePlayer1(user.username);
        game.updateGameIsCompetitive(false);
        game.updatePointsToWin(winningScore.value);
        game.updateGameLevel(checkboxState.value ? 'Hard' : 'Easy');
        router.push({ name: 'training' });
      };

      const createGameOnServer = async () => {
        game.updatePlayer1(user.username);
        game.updateGameIsCompetitive(true);
        game.updatePointsToWin(winningScore.value);
        game.updateGameLevel(checkboxState.value ? 'Hard' : 'Easy');

        let gameCustomization : GameCustomization = {
          gameDifficult: checkboxState.value ? 'hard' : 'easy',
          winningScore: winningScore.value
        }
        game.gameCustomization = gameCustomization;
        user.socket?.emit('search-game', gameCustomization);
      };

      async function createPrivateMatch() {
        
        await usersAreFriends();
        opponentIsInGame();

        if (friendship.value === false || opponentInGame.value === true) {
          return;
        }

        let gameCustomization : GameCustomization = {
          gameDifficult: checkboxState.value ? 'hard' : 'easy',
          winningScore: winningScore.value
        }
        game.gameCustomization = gameCustomization;
        user.socket?.emit('challenge', {toUserId: props.opponentId, gameCustomization: gameCustomization});
      };

      async function usersAreFriends() {
        const user1Friends = await user.getUserFriendsIds();
        const user2Friends = await user.getUserFriendsIds(props.opponentId);

        const user1IsFriendOfUser2 = user1Friends.includes(props.opponentId);
        const user2IsFriendOfUser1 = user2Friends.includes(user.id);

        if (user1IsFriendOfUser2 && user2IsFriendOfUser1) {
          friendship.value = true;
        } else {
          friendship.value = false;
        }
      };

      function opponentIsInGame() {
        opponentInGame.value = spectator.isInGame(props.opponentId);
      }

      return {
        checkboxState,
        scores,
        winningScore,
        friendship,
        opponentInGame,
        startPractice,
        createGameOnServer,
        createPrivateMatch
      };
    },
  });
</script>
  
<style scoped>
.tittle {
  margin-top: 0px;
  margin-bottom: 20px;
}

.level-toggle {
  display: flex;
  align-items: center;
  padding: 20px;
}

/* Estilo del switch (botón deslizante) */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  margin: 0 10px;
}

/* Oculta el checkbox original */
.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

/* Estilo del slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #f1b307;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Estilos adicionales para redondear los bordes del slider */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.dropdown-menu {
  padding: 10px;
}

.label {
  padding-right: 15px;
}

.button-container {
  border: 5px solid #c7c7c7;
  border-radius: 25px;
  box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.5); /* Sombra difusa */
  margin-top: 50px;
  padding: 10px 10px;
  display: flex;
  flex-wrap: wrap; /* Permite que los elementos se envuelvan si no hay espacio */
  justify-content: center; /* Centra los elementos horizontalmente */
  align-items: center; /* Alinea los elementos verticalmente en el centro */
}

.button {
  display: inline-block; /* Permite aplicar ancho y alto */
  min-width: 280px;
  min-height: 25px;
  padding: 0 10px; /* Añade un poco de espacio interno */
  text-decoration: none; /* Elimina el subrayado del enlace */
  text-align: center; /* Centra el texto */
  border-radius: 15px; /* Bordes redondeados */
  cursor: pointer; /* Cursor tipo botón */
  line-height: 50px; /* Centra el texto verticalmente */
  font-size: 20px;
}

.rules {
  margin: 40px 0 0 20px;
  text-decoration: underline;
}

.error-message {
  margin-top: 10px; /* Espacio entre el botón y el mensaje */
  color: red; /* Color del mensaje de error */
  /* Otros estilos que necesites */
}

.challenge-container {
  display: flex;
  flex-direction: column; /* Alinea los elementos en dirección vertical */
  align-items: center; /* Centra los elementos horizontalmente */
  justify-content: center; /* Opcional, para centrar verticalmente si es necesario */
}
</style>
