<template>
    <MainMenu />
    <div class="main-frame">
      <div id="pong-game">
        <div class="game-settings" :class="{'small-font': isCanvasSmall}">
          <span class="level">LEVEL: {{ gameLevel }}</span>
          <span class="winning-score">WINNING SCORE: {{ gameWinningScore }}</span>
        </div>
        <div class="score-board">
          <div class="player-info" :class="{'small-font': isCanvasSmall}">
            <span class="player-name">{{ state.p1.name }}</span>
            <span class="player-score">{{ state.p1.score }}</span>
          </div>
          <div v-if="gameEnded" class="popup">
            <div class="popup-content">
              <h2>WINNER: {{ gameWinner }}</h2>
              <router-link to="/game-config" class="button">OK</router-link>
            </div>
          </div>
          <div class="ia-info" :class="{'small-font': isCanvasSmall}">
            <span class="ai-name">{{ state.p2.name }}</span>
            <span class="ai-score">{{ state.p2.score }}</span>
          </div>
        </div>
        <div class="game-container">
          <canvas ref="pongCanvas"></canvas>
          <button v-if="!gameStarted" class="start-button" @click="startGame">START</button>
        </div>
        <div class="interrupt-container">
          <button class="button" @click="interruptGame">Quit game</button>
        </div> 
      </div>
    </div>
  </template>
    
  <script lang="ts">
    
    import { defineComponent, onMounted, onBeforeUnmount, ref, reactive, computed } from "vue";
    import MainMenu from "../components/MainMenu.vue";
    import { useRouter } from "vue-router";
    import { game } from "../game";
  
    export default defineComponent({
      components: {
        MainMenu,
      },
      setup() {
        // Propiedades estáticas
        const router = useRouter();
        const gameLevel: string = game.getGameLevel();
        const gameWinningScore: number = game.getPointsToWin();
        const difficultyMultiplier = gameLevel === 'Hard' ? 1.9 : 1;
  
        // Propiedades reactivas
        const pongCanvas = ref<HTMLCanvasElement | null>(null);
        const gameStarted = ref(false);
        const gameEnded = ref(false);
        const gameWinner = ref('');

        type PaddleType = typeof state.p1;
  
        const state = reactive({
          p1: {
            x: 0,
            y: 0,
            speedY: 0,
            score: 0,
            name: game.getPlayer1()
          },
          p2: {
            x: 0,
            y: 0,
            speedY: 0,
            score: 0,
            name: "Computer"
          },
          ball: {
            x: 0,
            y: 0,
            size: 0,
            speedX: 0,
            speedY: 0,
          },
          paddles: {
            width: 0,
            height: 0,
            speed: 0,
          },
          canvas: {
            lastWidth: 0,
            actualWidth: 0,
            isResized: false,
          }
        });
  
        const checkForWinner = () => {
          if (state.p1.score >= gameWinningScore) {
            gameEnded.value = true;
            gameWinner.value = state.p1.name;
            gameStarted.value = false;
          } else if (state.p2.score >= gameWinningScore) {
            gameEnded.value = true;
            gameWinner.value = state.p2.name;
            gameStarted.value = false;
          }
        };

        const interruptGame = () => {
          // Resetear el estado del juego a su estado inicial
          gameStarted.value = false;
          state.p1.score = 0;
          state.p2.score = 0;
          state.p1.y = state.canvas.actualWidth / 2;
          state.p2.y = state.canvas.actualWidth / 2;
          state.ball.x = state.canvas.actualWidth / 2;
          state.ball.y = state.canvas.actualWidth / 4;
          state.ball.speedX = 0;
          state.ball.speedY = 0;

          router.push('/game-config');
        };

        const startGame = () => {
          gameStarted.value = true;
          resetBallAndServe();
          requestAnimationFrame(gameLoop);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
          // Controles del jugador 1
          if (event.key === 'ArrowUp') {
            state.p1.speedY = -state.paddles.speed; // Ajusta la velocidad según sea necesario
          } else if (event.key === 'ArrowDown') {
            state.p1.speedY = state.paddles.speed; // Ajusta la velocidad según sea necesario
          }
         };

        const handleKeyUp = (event: KeyboardEvent) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            state.p1.speedY = 0;
          }
        };

        const resetBallAndServe = () => {
          // Coloca la pelota en el centro, pero detiene su movimiento
          state.ball.x = state.canvas.actualWidth / 2;
          state.ball.speedX = 0;
          state.ball.speedY = 0;

          // Establece una posición vertical aleatoria que tenga en cuenta el tamaño de la pelota
          const minY = state.ball.size;
          const maxY = (state.canvas.actualWidth / 2) - state.ball.size;
          state.ball.y = minY + Math.random() * (maxY - minY);

          // Espera dos segundos antes de reiniciar el movimiento
          setTimeout(() => {
            // Altura inicial aleatoria y velocidad/dirección
            const baseSpeed = state.canvas.actualWidth / 200;
            state.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * baseSpeed * difficultyMultiplier;
            state.ball.speedY = (Math.random() > 0.5 ? 1 : -1) * baseSpeed * difficultyMultiplier;
          }, 2000); // 2000 milisegundos = 2 segundos
        };

        const move = () => {
          // Actualiza la posición de la pala del jugador 1
          state.p1.y += state.p1.speedY;
          // Previene que la pala salga del canvas
          state.p1.y = Math.max(0, Math.min(state.p1.y, state.canvas.actualWidth / 2 - state.paddles.height));
          
          // Actualiza pala jugador 2 (IA)
          const paddleCenter = state.p2.y + state.paddles.height / 2;
          const aiSpeedAdjustment = difficultyMultiplier * 3.5; // Ajusta la velocidad base y multiplica por el multiplicador de dificultad
          if (state.ball.y > paddleCenter) {
            state.p2.speedY = aiSpeedAdjustment; // Ajusta la velocidad según sea necesario
          } else if (state.ball.y < paddleCenter) {
            state.p2.speedY = -aiSpeedAdjustment; // Ajusta la velocidad según sea necesario
          }
          state.p2.y += state.p2.speedY;
          // Previene que la pala salga del canvas
          state.p2.y = Math.max(0, Math.min(state.p2.y, state.canvas.actualWidth / 2 - state.paddles.height));

          // Mueve la pelota horizontalmente y verticalmente
          state.ball.x += state.ball.speedX;
          state.ball.y += state.ball.speedY;
          if (state.ball.y - state.ball.size < 0 || state.ball.y + state.ball.size > state.canvas.actualWidth / 2) {
            state.ball.speedY *= -1;
          }

          // Detecta colisión con paredes horizontales
          if (state.ball.x - state.ball.size < 0) {
            // La pelota toca el borde izquierdo
            state.p2.score++; // Jugador 2 gana un punto
            resetBallAndServe(); // Reinicia la posición de la pelota
          } else if (state.ball.x + state.ball.size > state.canvas.actualWidth) {
            // La pelota toca el borde derecho
            state.p1.score++; // Jugador 1 gana un punto
            resetBallAndServe(); // Reinicia la posición de la pelota
          }

          // Detección de colisiones con las palas
          if (checkCollisionWithPaddle(state.p1)) {
            handlePaddleCollision(state.p1);
          }
          if (checkCollisionWithPaddle(state.p2)) {
            handlePaddleCollision(state.p2);
          }
        };

        const checkCollisionWithPaddle = (paddle: PaddleType) => {
          return (
            state.ball.x - state.ball.size < paddle.x + state.paddles.width &&
            state.ball.x + state.ball.size > paddle.x &&
            state.ball.y + state.ball.size > paddle.y &&
            state.ball.y - state.ball.size < paddle.y + state.paddles.height
          );
        };

        const handlePaddleCollision = (paddle: PaddleType) => {
          // Determina si la pelota golpea el centro de la pala
          const hitTopEdge = state.ball.y < paddle.y;// && state.ball.y > paddle.y - 5; // Ajusta estos valores según sea necesario
          const hitBottomEdge = state.ball.y > paddle.y + state.paddles.height;// && state.ball.y < paddle.y + state.paddles.height + 5; // Ajusta estos valores según sea necesario

          if (state.ball.x < 0) {
            state.p1.score++;
            resetBallAndServe(); // Reinicia la posición de la pelota
          } else if (state.ball.x > state.canvas.actualWidth) {
            state.p2.score++;
            resetBallAndServe(); // Reinicia la posición de la pelota
          }
          else {
           // const impactPoint = (state.ball.y - (paddle.y + state.paddles.height / 2)) / (state.paddles.height / 2);
           // state.ball.speedY += impactPoint * 2; // Ajusta el factor multiplicador según sea necesario para cambiar la dirección vertical
            state.ball.speedX *= -1;
          }
          // if (!hitTopEdge && !hitBottomEdge) {
          //   console.log("hitTopEdge: ", hitTopEdge, " hitBottomEdge: ", hitBottomEdge);
          //   console.log("padel Y : ", paddle.y, " ball Y:", state.ball.y);

          //   // Invierte la dirección horizontal si golpea la parte central de la pala
          //   state.ball.speedX *= -1;

          //   // Ajusta ligeramente la dirección vertical para mantener el ángulo
          //   const impactPoint = (state.ball.y - (paddle.y + state.paddles.height / 2)) / (state.paddles.height / 2);
          //   state.ball.speedY += impactPoint * 2; // Ajusta el factor multiplicador según sea necesario para cambiar la dirección vertical
          // } else {
          //   // Si la pelota golpea justo en el borde, se cuele hacia el fondo
          //   if (paddle === state.p1) {
          //     state.p2.score++; // Jugador 2 gana un punto
          //   } else {
          //     state.p1.score++; // Jugador 1 gana un punto
          //   }
          //   resetBallAndServe(); // Reinicia la posición de la pelota
          // }
        };

        const gameLoop = () => {
          if (!gameStarted.value || gameEnded.value) {
            return; // Detiene el bucle si el juego no ha comenzado
          }
          if (state.canvas.isResized) {
            widthChanges();
            adjustPositions();
            draw(state.p1.x, state.p1.y, state.p2.x, state.p2.y, state.ball.x, state.ball.y);
            state.canvas.isResized = false;
          } else {
            draw(state.p1.x, state.p1.y, state.p2.x, state.p2.y, state.ball.x, state.ball.y);
            move();
          }
          checkForWinner();
          requestAnimationFrame(gameLoop);
        };

        const draw = (p1x: number, p1y: number, p2x:number, p2y: number, bx:number, by: number) => {
          if (pongCanvas.value) {
            const canvas = pongCanvas.value;
            const ctx = canvas.getContext('2d');
            // Actualiza tamaño de canvas en el DOM
            canvas.width = state.canvas.actualWidth;
            canvas.height = state.canvas.actualWidth / 2;
            if (ctx) {
              // Pinta las palas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'white';
              ctx.fillRect(p1x, p1y, state.paddles.width, state.paddles.height);
              ctx.fillRect(p2x, p2y, state.paddles.width, state.paddles.height);
              // Pinta la pelota
              ctx.beginPath();
              ctx.arc(bx, by, state.ball.size, 0, Math.PI * 2);
              ctx.fillStyle = 'white';
              ctx.fill();
              ctx.closePath();
            }
          }
        };
  
        const adjustPositions = () => {
          state.p1.x = state.canvas.actualWidth / 100;
          state.p1.y = Math.round ((state.p1.y / (state.canvas.lastWidth / 2)) * (state.canvas.actualWidth / 2));
          state.p2.x = state.canvas.actualWidth - (state.p1.x * 2);
          state.p2.y = Math.round ((state.p2.y / (state.canvas.lastWidth / 2)) * (state.canvas.actualWidth / 2));
          state.ball.x = Math.round ((state.ball.x / state.canvas.lastWidth) * state.canvas.actualWidth);
          state.ball.y = Math.round ((state.ball.y / (state.canvas.lastWidth / 2)) * (state.canvas.actualWidth / 2));
        };

        const adjustSizeAndSpeed = (width: number) => {
          state.canvas.lastWidth = state.canvas.actualWidth;
          state.canvas.actualWidth = width;

          // Ajusta tamaño de palas y pelota
          state.paddles.height = width / 10;
          state.paddles.width = width / 100;
          state.ball.size = width / 100;

          // Ajusta la velocidad de la pelota
          const baseSpeed = width / 200;
          state.ball.speedX = baseSpeed * (state.ball.speedX > 0 ? 1 : -1) * difficultyMultiplier;
          state.ball.speedY = baseSpeed * (state.ball.speedY > 0 ? 1 : -1) * difficultyMultiplier;


          // Ajusta la velocidad de las palas
          // state.paddles.speed = width / 200;
          const basePaddleSpeed = width / 100; // Aquí se ha aumentado la velocidad base de las palas
          state.paddles.speed = basePaddleSpeed * difficultyMultiplier; // Ajusta la velocidad según la dificultad

        };

        const drawInitialState = () => {
          const width = window.innerWidth;
          if (width > 850) {
            state.canvas.actualWidth = 800;
            state.p1.y = state.p2.y = 160;
            state.ball.x = 396;
            state.ball.y = 196;
          }
          else if (width < 650) {
            state.canvas.actualWidth = 400;
            state.p1.y = state.p2.y = 80;
            state.ball.x = 198;
            state.ball.y = 98;
          }
          else {
            state.canvas.actualWidth = 600;
            state.p1.y = state.p2.y = 120;
            state.ball.x = 297;
            state.ball.y = 147;
          }
          adjustSizeAndSpeed(state.canvas.actualWidth);
          adjustPositions();
        };

        const widthChanges = () => {
          const width = window.innerWidth;
          if (width > 850 && state.canvas.actualWidth !== 800)
              adjustSizeAndSpeed(800);
          else if (width < 650 && state.canvas.actualWidth !== 400)
            adjustSizeAndSpeed(400);
          else if (width <= 850 && width >= 650 && state.canvas.actualWidth !== 600)
            adjustSizeAndSpeed(600);
        };

        const notifyResize = () => {
          const width = window.innerWidth;
          if (width > 850 && state.canvas.actualWidth !== 800
            || width < 650 && state.canvas.actualWidth !== 400
            || width <= 850 && width >= 650 && state.canvas.actualWidth !== 600)
            state.canvas.isResized = true;
        };

        onMounted(() => {
          window.addEventListener('keydown', handleKeyDown);
          window.addEventListener('keyup', handleKeyUp);
          window.addEventListener('resize', notifyResize);
          drawInitialState();
          requestAnimationFrame(gameLoop);
        });
  
        onBeforeUnmount(() => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);  
          window.removeEventListener('resize', notifyResize);
        });

        const isCanvasSmall = computed(() => {
          return state.canvas.actualWidth === 400;
        });
  
        return { pongCanvas, state, gameLevel, gameWinningScore, gameStarted, gameEnded, gameWinner, startGame, interruptGame, isCanvasSmall, difficultyMultiplier };
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