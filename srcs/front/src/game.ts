// src/game.ts

import { reactive } from "vue";
import { user } from "./user";
import type { GameCustomization } from "./interfaces";
import router from './router/index';

interface ScoreBoard {
    user1Name: string;
    user2Name: string;
    user1Score: number;
    user2Score: number;
}

interface PlayersUsernames {
    user1: string;
    user2: string;
}

interface Challenge {
    fromUserId: number;
    gameCustomization: GameCustomization;
}

export enum GameState {
    None,
    Searching,
    Ready,
    Playing,
    End,
}

class Game {
    public player1: string = '';
    public player2: string = '';
    public gameIsCompetitive: boolean = false;
    public gameLevel: string = '';
    public pointsToWin: number = 0;
    public player1Points: number = 0;
    public player2Points: number = 0;
    public winner: string  = '';
    
    public gameCustomization : GameCustomization = {
        gameDifficult: 'easy',
        winningScore: 5
    };
    public state: GameState = GameState.None;
    public scoreBoard: ScoreBoard = {
        user1Name: "",
        user2Name: "",
        user1Score: 0,
        user2Score: 0,
    };

    async setEventHandlers() {
        user.socket?.on('start-game', (playersNames: PlayersUsernames) => {
            this.startGame(playersNames);
        });
        this.checkPlayerContinuity();
        return;
    }

    async startGame(playersNames: PlayersUsernames) {
        this.state = GameState.Playing;
        this.scoreBoard.user1Name = playersNames.user1;
        this.scoreBoard.user2Name = playersNames.user2;
        window.addEventListener("keydown", (e) => {
            if (e.key == "ArrowUp") {
                e.preventDefault();
                user.socket?.emit("move", "ArrowUp", true);
            } else if (e.key == "ArrowDown") {
                e.preventDefault();
                user.socket?.emit("move", "ArrowDown", true);
            }
        });
        window.addEventListener("keyup", (e) => {
            if (e.key == "ArrowUp") {
                e.preventDefault();
                user.socket?.emit("move", "ArrowUp", false);
            } else if (e.key == "ArrowDown") {
                e.preventDefault();
                user.socket?.emit("move", "ArrowDown", false);
            }
        });
        router.push({name: "competitive"})
    }

    endGame() {
        this.state = GameState.End;
    }
    
    checkPlayerContinuity() {
        user.socket?.emit('check-game-continuity', user.id);
    }

    updatePlayer1(name: string) : void {
        this.player1 = name;
    }

    updatePlayer2(name: string) : void {
        this.player2 = name;
    }

    updateGameIsCompetitive(isCompetitive: boolean): void {
        this.gameIsCompetitive = isCompetitive;
    }

    updateGameLevel(gameLevel: string): void {
        this.gameLevel = gameLevel;
    }

    updatePointsToWin(pointsToWin: number): void {
        this.pointsToWin = pointsToWin;
    }

    updatePoints(player1Points: number, player2Points: number): void {
        this.player1Points = player1Points;
        this.player2Points = player2Points;
    }

    updateWinner(winner: string) {
        this.winner = winner;
    }

    getPlayer1(): string {
        return this.player1;
    }

    getPlayer2(): string {
        return this.player2;
    }

    getGameIsCompetitive(): boolean {
        return this.gameIsCompetitive;
    }

    getGameLevel(): string {
        return this.gameLevel;
    }

    getPointsToWin(): number {
        return this.pointsToWin;
    }

    getPlayer1Points(): number {
        return this.player1Points;
    }

    getPlayer2Points(): number {
        return this.player2Points;
    }

    getWinner(): string {
        return this.winner;
    }
}

export const game = reactive<Game>(new Game);