import { reactive } from 'vue';
import { user } from './user';
import router from './router/index';
import type { GameCustomization } from "./interfaces";

export interface OngoingGame {
	name: string;
	gameCustomization: GameCustomization,
	player1: string;
	player1Id: number;
	player1AvatarURL: string;
	player1Score: number;
	player2: string;
	player2Id: number;
	player2AvatarURL: string;
	player2Score: number;
}

class Spectator {

	public ongoingGames: OngoingGame[] = [];

	setEventHandlers() {
		user.socket?.on("ongoing-games", (games: OngoingGame[]) => { this.fetchOngoingGames(games) });
		user.socket?.emit("getOngoingGames");
	}

	fetchOngoingGames(games: OngoingGame[]) {
		this.ongoingGames.length = 0; // Limpia el arreglo actual
		this.ongoingGames.push(...games); // Agrega los nuevos juegos
	}

	watchGame(gameName: string) {
		router.push({
			name: "spectate",
			params: { matchId: gameName }
		})
	}

	findGame(userId: number) {
		const game = this.ongoingGames.find((game) => {
			if (game.player1Id == userId || game.player2Id == userId) {
				return game;
			}
		});

		if (game) {
			this.watchGame(game.name);
		}
	}

	isInGame(userId: number) : boolean {
		for (const game of this.ongoingGames) {
			if (game.player1Id == userId || game.player2Id == userId) {
				return true;
			}
		}
		return false;
	}

	stopSpectating(matchId: string) {
		user.socket?.emit("spectate-leave", matchId);
	}
}

export const spectator = reactive<Spectator>(new Spectator);
