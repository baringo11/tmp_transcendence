import { Server } from 'socket.io';
import { GatewayUser } from "src/app-gateway/interfaces/gateway-user.interface";
import { UsersService } from 'src/users/users.service';
import { AppGatewayService } from 'src/app-gateway/appGateway.service';
import { Player, GameResult, GameCustomization } from './interfaces/game.interface';

type Ball = {
    x: number,
    y: number,
    size: number,
    speedX: number,
    speedY: number,
}

type Paddle = {
    x: number,
    y: number,
    width: number,
    height: number,
    speed: number,
    up: boolean,
    down: boolean
}

export default class Game {
    name: string;
    players: Player[] = [];
    viewers: GatewayUser[] = [];
    startDate: Date;
    gameInterval: NodeJS.Timer;
    server: Server;
    winner: string = "";
    gameCustomization: GameCustomization;

    ball: Ball;
    paddles: Paddle[] = new Array(2);
    canvas;

	endGameCallbacks: Function[] = []
	startGameCallbacks: Function[] = []

    constructor(
        player1: GatewayUser,
        player2: GatewayUser,
        server: Server,
        gameCustomization: GameCustomization,
        public usersService: UsersService,
        public appGatewayService: AppGatewayService
    ) {
        this.server = server;
        this.gameCustomization = gameCustomization;

        const player1interface: Player = {
            user: player1,
            score: 0,
            result: GameResult.Draw,
        }
        const player2interface: Player = {
            user: player2,
            score: 0,
            result: GameResult.Draw,
        }
        this.players.push(player1interface);
        this.players.push(player2interface);

        this.name = this.players[0].user.username + '_game_' + this.players[1].user.username;

        for (const i in this.players) {
            this.players[i].user.socket.join(this.name);
            //this.players[i].user.socket.setMaxListeners(0);
        }

        this.startDate = new Date();

        this.setEndGameCallback(() => this.notifyEndGameToAllUsers());
        this.setEndGameCallback(() => this.removePlayersFromGameChannel());
    }

    start() {
        this.ball = {
            x: 400,
            y: 200,
            size: 8,
            speedX: 0,
            speedY: 0,
        }
        this.paddles[0] = {
            x: 2,
            y: 160,
            width: 8,
            height: 80,
            speed: 0,
            up: false,
            down: false
        }

        this.paddles[1] = {
            x: 800 - 10,
            y: 160,
            width: 8,
            height: 80,
            speed: 0,
            up: false,
            down: false
        }
        this.canvas = {
            lastWidth: 0,
            actualWidth: 800
        }

        this.server.to(this.name).emit('start-game', {
            user1: this.players[0].user.username,
            user2: this.players[1].user.username,
        });

        this.players.forEach((player, playerIndex) => {
            this.setMoveEvent(player, playerIndex);
        });

        this.callStartGameCallbacks();

        this.appGatewayService.setGatewayUserGamingStatus(this.players[0].user.id);
        this.appGatewayService.setGatewayUserGamingStatus(this.players[1].user.id);

        setTimeout(() => {
            const baseSpeed = this.canvas.actualWidth / 200;
            this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
            this.ball.speedY = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
          }, 2000);

        this.gameInterval = setInterval(() => {
            this.gameLoop();
        }, 1/60 * 1000);
    }

    setMoveEvent(player: Player, playerIndex: number) {
        player.user.socket.on('move', (movement: string, pressed: boolean) => {
            if (pressed) {
                if (movement === 'ArrowUp') {
                    this.paddles[playerIndex].speed = -4;
                    this.paddles[playerIndex].up = true;
                }
                else if (movement === 'ArrowDown') {
                    this.paddles[playerIndex].speed = 4;
                    this.paddles[playerIndex].down = true;
                }
            }
            else {
                if (movement === 'ArrowUp') {
                    this.paddles[playerIndex].up = false;
                    this.paddles[playerIndex].speed = 0;
                    if (this.paddles[playerIndex].down)
                        this.paddles[playerIndex].speed = 4;
                }
                else if (movement === 'ArrowDown') {
                    this.paddles[playerIndex].down = false;
                    this.paddles[playerIndex].speed = 0;
                    if (this.paddles[playerIndex].up)
                        this.paddles[playerIndex].speed = -4;
                }
            }
        });
    }

    checkGameTimeIsOver(currentTime: Date): boolean {
		return currentTime.getTime() - this.startDate.getTime() >= 200 * 1000;
	}

    checkIfMaxScoreWasReached(): boolean {
		return (this.players[0].score === this.gameCustomization.winningScore || this.players[1].score === this.gameCustomization.winningScore);
	}

    gameLoop() {
        const now = new Date();

        if (this.checkIfMaxScoreWasReached()) {
            this.end();
        }
        this.updateObjects();
        const payload = {
            paddles: this.paddles,
            score: [this.players[0].score, this.players[1].score],
            ball: this.ball,
            currentTime: now.getTime() - this.startDate.getTime(),
        };
        this.server.to(this.name).emit('update-game', payload);
    }

    updateObjects() {
        this.paddles[0].y += this.paddles[0].speed;
        this.paddles[1].y += this.paddles[1].speed;

        // Previene que las palas salgan del canvas
        this.paddles[0].y = Math.max(2, Math.min(this.paddles[0].y, this.canvas.actualWidth / 2 - this.paddles[0].height));
        this.paddles[1].y = Math.max(2, Math.min(this.paddles[1].y, this.canvas.actualWidth / 2 - this.paddles[1].height));

        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        if (this.ball.y - this.ball.size < 0 || this.ball.y + this.ball.size > this.canvas.actualWidth / 2) {
            this.ball.speedY *= -1;
        }

        if (this.checkCollisionWithPaddle(0)) {
            this.handlePaddleCollision(0);
            if (this.gameCustomization.gameDifficult === 'hard') {
                this.ball.speedX += this.ball.speedX * 0.15;
                this.ball.speedY += this.ball.speedY * 0.15;
            }
        }
        if (this.checkCollisionWithPaddle(1)) {
            this.handlePaddleCollision(1);
            if (this.gameCustomization.gameDifficult === 'hard') {
                this.ball.speedX += this.ball.speedX * 0.15;
                this.ball.speedY += this.ball.speedY * 0.15;
            }
        }

        if (this.ball.x - this.ball.size < 0) {
            // La pelota toca el borde izquierdo
            this.players[1].score++;
            this.paddles[1].height -= this.gameCustomization.gameDifficult === 'hard' ? 6 : 0;
            this.resetBallAndServe();
        } else if (this.ball.x + this.ball.size > this.canvas.actualWidth) {
            // La pelota toca el borde derecho
            this.players[0].score++;
            this.paddles[0].height -= this.gameCustomization.gameDifficult === 'hard' ? 6 : 0;
            this.resetBallAndServe();
        }
    }

    checkCollisionWithPaddle(paddleIndex: number) : boolean{
        const paddle = this.paddles[paddleIndex];
        return (
            this.ball.x - this.ball.size < paddle.x + paddle.width &&
            this.ball.x + this.ball.size > paddle.x &&
            this.ball.y + this.ball.size > paddle.y &&
            this.ball.y - this.ball.size < paddle.y + paddle.height
        );
    };

    handlePaddleCollision(paddleIndex: number) {
        const paddle = this.paddles[paddleIndex];
        // Determina si la pelota golpea el centro de la pala
        const hitTopEdge = this.ball.y < paddle.y;
        const hitBottomEdge = this.ball.y > paddle.y + paddle.height;

        if (!hitTopEdge && !hitBottomEdge) {
            // Invierte la dirección horizontal si golpea la parte central de la pala
            this.ball.speedX *= -1;

            // Ajusta ligeramente la dirección vertical para mantener el ángulo
            const impactPoint = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            this.ball.speedY += impactPoint * 2; // Ajusta el factor multiplicador según sea necesario para cambiar la dirección vertical
        } else {
            // Si la pelota golpea justo en el borde, se cuele hacia el fondo
            if (paddleIndex === 0) {
                this.players[1].score++; // Jugador 2 gana un punto
                this.paddles[1].height -= this.gameCustomization.gameDifficult === 'hard' ? 8 : 0;
            } else {
                this.players[0].score++; // Jugador 1 gana un punto
                this.paddles[0].height -= this.gameCustomization.gameDifficult === 'hard' ? 8 : 0;
            }
            this.resetBallAndServe(); // Reinicia la posición de la pelota
        }
    }

    resetBallAndServe() {
        // Coloca la pelota en el centro, pero detiene su movimiento
        this.ball.x = this.canvas.actualWidth / 2;
        this.ball.speedX = 0;
        this.ball.speedY = 0;

        // Establece una posición vertical aleatoria que tenga en cuenta el tamaño de la pelota
        const minY = this.ball.size;
        const maxY = (this.canvas.actualWidth / 2) - this.ball.size;
        this.ball.y = minY + Math.random() * (maxY - minY);

        // Espera dos segundos antes de reiniciar el movimiento
        setTimeout(() => {
          // Altura inicial aleatoria y velocidad/dirección
          const baseSpeed = this.canvas.actualWidth / 200;
          this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
          this.ball.speedY = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
        }, 2000);
      };

    resolvePlayersGameResultFromScore(): void {
        this.players.forEach(async (player, index) => {
            const otherPlayer: Player = this.players[(index + 1) % 2];

            if (player.score > otherPlayer.score) {
                player.result = GameResult.Win;
                this.winner = player.user.username;
            } else if (player.score < otherPlayer.score) {
                player.result = GameResult.Lose;
                this.winner = otherPlayer.user.username;
            } else {
                player.result = GameResult.Draw;
            }
        });
    }

    end(gameEnderIndex: number = -1) {
        clearInterval(this.gameInterval);
        
        if (gameEnderIndex != -1) {
            this.winner =  this.players[gameEnderIndex == 0 ? 1 : 0].user.username;
            this.players[gameEnderIndex].result = GameResult.Lose;
            this.players[gameEnderIndex == 0 ? 1 : 0].result = GameResult.Win;
        } else {
            this.resolvePlayersGameResultFromScore();
        }
        
        this.players.forEach(async (player, index) => {
            player.user.socket.emit('end-game', player.result);
            this.appGatewayService.unsetGatewayUserGamingStatus(player.user.id);
        });
        this.callEndGameCallbacks();
    }

    rejoinPlayer(playerRejoin: GatewayUser) {
        this.players.forEach(async (player, index) => {
            if (player.user.socket.connected === false) {
                player.user.socket = playerRejoin.socket;
                player.user.socket.join(this.name);
                //this.players[i].user.socket.setMaxListeners(0);
                this.setMoveEvent(player, index);
            }
        });
        this.appGatewayService.setGatewayUserGamingStatus(playerRejoin.id);
    }

    setStartGameCallback(fn: Function) {
		this.startGameCallbacks.push(fn);
	}

	callStartGameCallbacks() {
		this.startGameCallbacks.forEach(fn => {
			fn(this.name)
		});
	}

    setEndGameCallback(fn: Function) {
		this.endGameCallbacks.push(fn);
	}

    callEndGameCallbacks() {
		this.endGameCallbacks.forEach(fn => {
			fn(this.name)
		});
	}

    removePlayersFromGameChannel(): void {
        this.players.forEach((player) => player.user.socket.leave(this.name));
        this.viewers.forEach((viwer) => {viwer.socket.leave(this.name)});
    }

    notifyEndGameToAllUsers() {
		this.server.to(this.name).emit("spectator-end-game", this.winner);
	}
}
