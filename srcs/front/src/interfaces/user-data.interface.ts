export interface UserStats {
	wonGames: number;
	lostGames: number;
    drawGames: number;
}

export enum UserRole {
	USER = "user",
	ADMIN = "admin",
	OWNER = "owner"
}

export interface UserData {
    id: number;
    username: string;
    profileImg: string;
    isTwoFactorAuthenticationEnabled: boolean;
    inGame: Boolean;
    friendsIds: number[];
    blockedIds: number[];
    role: UserRole;
    isBanned: boolean;
    wonGames: number,
    lostGames: number,
    scoredGoals: number,
    receivedGoals: number,
    victoryPercentage: number,
}
