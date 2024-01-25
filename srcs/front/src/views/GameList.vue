<template>
  <MainMenu />
  <div class="main-frame">
    <div class="current-games">
      <h2>Current Games</h2>
      <div class="game-list">
        <div class="game-item header">
          <span>Counters</span>
          <span>Level</span>
          <span>Winning Score</span>
          <span>Action</span>
        </div>

        <div v-if="games.length > 0">

          <div v-for="(game, index) in games" :key="index">
            <div class="game-item">
              <span>{{ game.player1 }} vs {{ game.player2}}</span>
              <span>{{ game.gameCustomization.gameDifficult }}</span>
              <span>{{ game.gameCustomization.winningScore }}</span>
              <button @click="watchOrRejoinGame(game.name)">
                {{ isCurrentUserPlaying ? 'Rejoin' : 'Watch' }}
              </button>
            </div>
          </div>

      </div>
      <div v-else >
        <div class="no-games">There's no one playing right now</div>
        <router-link to="/game-config" class="button2">Start a Game</router-link>

      </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import MainMenu from "../components/MainMenu.vue";
  import { user } from "../user";
  import { spectator } from "../spectator";
  import { game, GameState } from "../game";
  import { useRouter } from 'vue-router';


  export default {
    components: {
      // GameListItem,
      MainMenu,
    },
    setup() {
      const router = useRouter();
      const games = ref(spectator.ongoingGames);
      // const currentUsername = user.username;

      const isCurrentUserPlaying = computed(() => {
        return game.state === GameState.Playing;
      });

      const watchOrRejoinGame = (gameName: string) => {
        if (isCurrentUserPlaying.value) {
          router.push('/competitive');
        } else {
          spectator.watchGame(gameName);
        }
      };

      return { games, watchOrRejoinGame, isCurrentUserPlaying };



      // onMounted(() => {
      //   spectator.setEventHandlers();
      // });

      // const watchGame = (gameName: string) => {
      //   spectator.watchGame(gameName);
      // };

      // return { games, currentUsername, watchGame };
    }
  };
</script>

<style scoped>
.current-games {
  text-align: center;
}

/* .game-list {
  display: grid;
  margin-top: 35px;
  gap: 5px;
}

.game-item, .game-item.header {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  text-align: center;
  border-radius: 8px;
}

.game-item {
  margin-top: 0px;
  margin-bottom: 10px;
}

.game-item.header {
  background-color: #d1d1d1;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  padding: 15px 0;
  border-radius: 8px;
  margin-bottom: 15px;
}

.game-item.header span {
  color: #333;
}
.random-game-button-container {
  margin-top: 20px;
  margin-bottom: 40px;
}
.random-game-button {
  padding: 10px 20px;
  border-radius: 10px;
} */


.game-item {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 columnas */
  align-items: center;
  background-color: #f4f4f4;
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

.game-item.header {
  background-color: #d1d1d1;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  padding: 15px 0;
  border-radius: 8px;
  margin-bottom: 15px;
}

.game-item.header span {
  color: #333;
}

.button2 {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f1b307;
  color: rgb(7, 7, 7);
  transition: background-color 0.3s;
  width: 100%;
  margin-top: 30px;
}

.no-games {
  margin: 50px 0 30px 0;
  font-size: 1rem;
}
</style>