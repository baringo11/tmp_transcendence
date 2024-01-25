import { GatewayUser } from 'src/app-gateway/interfaces/gateway-user.interface';

export enum GameResult {
    Lose,
    Win,
    Draw,
}

export interface GameCustomization {
	gameDifficult: 'easy' | 'hard';
	winningScore: number;
}

export interface Player {
    user: GatewayUser;
    score: number;
    result: GameResult;
}

export interface ChallengeUserPayload {
	toUserId: number,
	gameCustomization: GameCustomization
}
