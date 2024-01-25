<template>
  <MainMenu /><!-- Inserta componente MainMenu -->
  <div class="main-frame">
    <!-- Contenedor para el título -->
    <div class="page-tittle">
      <h2>PONG rules</h2>
    </div>
    <!-- Lista de reglas -->
    <div class="rules">
      <ol>
        <li>
          <strong>Objective:</strong> The main objective of the Pong game is to score points by making the ball go to the opponent's court and pass in front of the opponent's paddle.
        </li>
        <li>
          <strong>Players:</strong> The game Pong is played between two players, one at each end of the screen. Each player controls one paddle.
        </li>
        <li>
          <strong>Paddles:</strong> Each player controls a paddle that moves vertically along the edge of their field. Paddles are used to hit the ball and return it to the opponent.
        </li>
        <li>
          <strong>Ball:</strong> A ball moves horizontally from one side to the other on the playing field. The objective is to prevent the ball from passing in front of your paddle and that of your opponent.
        </li>
        <li>
          <strong>Scoring:</strong> Players score points each time the ball passes in front of the opponent's paddle and touches the back of the field. The player who scores a point gains one point on his scoreboard.
        </li>
        <li>
          <strong>Paddle Movement:</strong> Players can move their paddles up and down to hit the ball. The movement of the paddles is controlled by the player using simple controls: up and down arrow keys.
        </li>
        <img src='/src/assets/arrow-keys.png' class="arrow-keys" />
        <li>
          <strong>Rebounds:</strong> The ball bounces off the paddles and the upper and lower walls of the field. Players must hit the ball with their paddles to prevent it from going through the back of their court.
        </li>
        <li>
          <strong>End of game:</strong> The game continues until a player reaches a predetermined number of points. The player who reaches the required score first wins.
        </li>
      </ol>
    </div>
    <router-link to="/game-config" class="Go-back">Go back</router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MainMenu from "@/components/MainMenu.vue";

export default defineComponent({
  name: "PongRules",
  components: {
    MainMenu,
  },
});
</script>

<style>
.Go-back {
  margin: 40px 0 0 20px;
  text-decoration: underline;
}

.rules li {
  padding: 5px;
}

.arrow-keys {
  width: 150px;
  display: block; /* Hace que la imagen sea un bloque para aplicar márgenes */
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 10px;
}
</style>
