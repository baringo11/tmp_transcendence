import { reactive } from 'vue';
import jwt_decode from "jwt-decode";
import type { JwtPayload, UserData } from './interfaces';
import type { Socket} from "socket.io-client";
import { io } from "socket.io-client";
import { channel } from './channel';
import { chat } from './chat';
import { game } from './game';
import { spectator } from './spectator';
import { notification } from './notification';
import { UserRole } from './interfaces/user-data.interface';
import router from './router/index';

class User
{
	public token: string | null = null;
	public id: number = -1;
	public socket: Socket | null = null;
	public socketId: string | undefined;

	public username: string = '';

    public isLogged: boolean = false;
	public alreadyConnected: boolean = false;

	public profileImg: string = '';

	public usersOnline: UserData[] = [];
	public usersFriends: UserData[] = [];
	public usersBlocked: UserData[] = [];

	public role: UserRole = UserRole.USER;
	public isBannedFromWebsite: boolean = false;

	public wonGames = 0;
	public lostGames = 0;
	public scoredGoals = 0;
	public receivedGoals = 0;

    async auth(access_token: string) {
        if (this.token && this.token === access_token)
			return { success: true };

        this.token = access_token;
		localStorage.setItem("token", access_token);

        try {
			const decoded: JwtPayload = jwt_decode(this.token);
			this.id = decoded.id;

			const userData: UserData | null = await this.getUserData();
			if (!userData) {
				return { success: false, message: "error fetching user data"};
			}

			this.username = userData.username;
			this.profileImg = `${import.meta.env.VITE_BACKEND_URL}/` + userData.profileImg;

			this.role = userData.role;
			this.isBannedFromWebsite = userData.isBanned;
			this.wonGames = userData.wonGames;
			this.lostGames = userData.lostGames;
			this.scoredGoals = userData.scoredGoals;
			this.receivedGoals = userData.receivedGoals;

			if (this.isBannedFromWebsite) {
				this.logout();
				return { success: false, message: "user is banned from website"};
			}

		} catch (error) {
            return { success: false, message: "error from decoding token"};
		}

		const needSecondFactorAuth = await this.checkIfSecondFactorAuthenticationIsNeeded(this.token);
		if (!needSecondFactorAuth) {
			this.isLogged = true;
			await this.updateUsersOnline();
			if (!this.socket){
				this.socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {auth: {token: access_token}});
				this.socket.on("alreadyConnected", () => { this.onAlreadyConnected(); });
				this.socket.on('connected', (user: UserData) => { this.updateUsersOnline(); });
				this.socket.on('disconnected', (user: UserData) => { this.updateUsersOnline(); });
				user.socket?.on('friend-in-a-game', (friendId: number) => {this.onFriendInAGame(friendId)});
				user.socket?.on('friend-game-ended', (friendId: number) => {this.onFriendGameEnded(friendId)});
	
				this.socket.on("website-admin", () => { this.onMakeWebsiteAdmin(); });
				this.socket.on("remove-website-admin", () => { this.onRemoveWebsiteAdmin(); });
				this.socket.on("banned-from-website", () => { this.onBanFromWebsite(); });
				this.socket.on("statsUpdated", () => { this.onStatsUpdated(); });
				await this.onConnect();
			}
			this.usersFriends = await this.getUserFriends();
			this.usersBlocked = await this.getBlockedUsers();
		}

		return { success: true };
    }

	async register(username: string, password: string) {
		const createUser = { username, password };

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(createUser)
		});

		const response = await httpResponse.json();

		if (httpResponse.status != 201) {
			return { success: false, message: response.message };
		}

		return { success: true };
	}

	async login(username: string, password: string) {
		const loginUser = { username, password };

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(loginUser)
		});

		const response = await httpResponse.json();

		if (httpResponse.status != 201) {
			return { success: false, message: response.message };
		}	
	
		return { success: true, message: response.access_token };
	}

	async loginWithIntra(): Promise<void> {
		const authorizeURL: string = import.meta.env.VITE_INTRA_API_AUTHORIZE_URL;
		const stateString: string = import.meta.env.VITE_STATE_STRING;
		if (authorizeURL){
			window.location.href = `${authorizeURL as string}&scope=public&state=${stateString}`;
		}
		else
			console.log("INTRA_API_AUTHORIZE_URL environment variable unset");
	}

	async getUserData(): Promise<UserData | null> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${this.id}`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`
			}
		});

		if (httpResponse.status != 200) {
			return null;
		}

		const response = await httpResponse.json();
		return response;
	}

	async validateToken(token: string): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`,
			}
		});

		return httpResponse.status == 200 ? true : false;
	}

	async getUserFriends(userId: number = this.id): Promise<UserData[]> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/friends/${userId}`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`
			}
		})

		if (httpResponse.status != 200) {
			return [];
		}
		let friends: UserData[] = await httpResponse.json();

		return friends.map(friend => ({ ...friend, inGame: spectator.isInGame(friend.id) }));
	}

	async getUserFriendsIds(userId: number = this.id): Promise<number[]> {
		const friends = await this.getUserFriends(userId);

		if (friends) {
			const friendsIds = friends.map(friend => friend.id);
			if (friendsIds)
				return friendsIds;
		}
		return [];
	}

	async addFriend(friendId: number): Promise<boolean> {
		const newFriendsIds = await this.getUserFriendsIds();

		if (!newFriendsIds.includes(friendId))
		{
			newFriendsIds?.push(friendId);
			chat.sendDirectMessage(friendId, " ** I added you to my friends! :) **");
			this.socket?.emit("addFriend", friendId);
		}
		else
			return false;

		return await this.updateFriendIds(newFriendsIds);
	}

	async deleteFriend(friendId: number): Promise<boolean> {
		const newFriendsIds = await this.getUserFriendsIds();
		const index = newFriendsIds.indexOf(friendId);

		if (index !== -1) {
			newFriendsIds.splice(index, 1);
			chat.sendDirectMessage(friendId, " ** I removed you from my friends! :( **");
			this.socket?.emit("removeFriend", friendId);
		}
		else
			return false;

		return await this.updateFriendIds(newFriendsIds);
	}

	async getBlockedUsers(): Promise<UserData[]> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/blocked/${this.id}`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`
			}
		})

		if (httpResponse.status != 200) {
			return [];
		}
		const blockUsers: UserData[] = await httpResponse.json();
		return blockUsers;
	}

	async getBlockedUsersIds(): Promise<number[]> {
		const blocked = await this.getBlockedUsers();

		if (blocked) {
			const blockedIds = blocked.map(blocked => blocked.id);
			if (blockedIds)
				return blockedIds;
		}
		return [];
	}

	async blockUser(blockedId: number): Promise<boolean> {
		const newBlockedIds = await this.getBlockedUsersIds();

		if (!newBlockedIds.includes(blockedId))
			newBlockedIds?.push(blockedId);
		else
			return false;

		return await this.updateBlockedIds(newBlockedIds);
	}

	async unblockUser(unblockedId: number): Promise<boolean> {
		const newBlockedIds = await this.getBlockedUsersIds();
		const index = newBlockedIds.indexOf(unblockedId);

		if (index !== -1)
			newBlockedIds.splice(index, 1);
		else
			return false;

		return await this.updateBlockedIds(newBlockedIds);
	}

	isWebsiteAdmin() {
		return this.role == UserRole.ADMIN || this.role == UserRole.OWNER;
	}

	isWebsiteOwner() {
		return this.role == UserRole.OWNER;
	}

	async makeWebsiteAdmin(newAdmin: UserData) {
		if (!this.isWebsiteOwner() || !newAdmin || newAdmin.role != UserRole.USER)
			return;

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/role/${newAdmin.id}`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${user.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({role: UserRole.ADMIN})
		});

		if (httpResponse.status != 200) {
			return;
		}

		user.socket?.emit("new-website-admin", newAdmin.id);
	}

	async removeWebsiteAdmin(removeAdmin: UserData) {
		if (!this.isWebsiteOwner() || !removeAdmin || removeAdmin.role != UserRole.ADMIN)
			return;

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/role/${removeAdmin.id}`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${user.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({role: UserRole.USER})
		});

		if (httpResponse.status != 200) {
			return;
		}

		user.socket?.emit("remove-website-admin", removeAdmin.id);
	}

	async banFromWebsite(newBanUser: UserData) {
		if (!this.isWebsiteAdmin() || !newBanUser || newBanUser.role !== UserRole.USER)
			return;

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${newBanUser.id}/ban`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${user.token}`,
			}
		});

		if (httpResponse.status != 200) {
			return;
		}

		user.socket?.emit("ban-from-website", newBanUser.id);
	}

	async unbanFromWebsite(removeBanUser: UserData) {
		if (!this.isWebsiteAdmin() || !removeBanUser || removeBanUser.role !== UserRole.USER)
			return;

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${removeBanUser.id}/unban`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${user.token}`,
			}
		});

		if (httpResponse.status != 200) {
			return;
		}
	}

	onMakeWebsiteAdmin() {
		this.role = UserRole.ADMIN;
		notification.notify({message: `You have been promoted to website MODERATOR!`})
	}

	onRemoveWebsiteAdmin() {
		this.role = UserRole.USER;
		router.replace({ "name": "home" });
		notification.notify({message: `You have been demoted to regular user website!`})
	}

	onBanFromWebsite() {
		notification.notify({message: `You have been banned from website!`})
		this.isBannedFromWebsite = true;
		this.logout();
		router.replace({ "name": "login" });
	}

	async onStatsUpdated() {
		const userUpdated = await this.getUserData();
		if (!userUpdated)
			return;
		this.wonGames = userUpdated.wonGames;
		this.lostGames = userUpdated.lostGames;
		this.scoredGoals = userUpdated.scoredGoals;
		this.receivedGoals = userUpdated.receivedGoals;
	}

	async updateFriendIds(newFriendsIds: number[]): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${this.id}`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${this.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({friendsIds: newFriendsIds})
		})

		if (httpResponse.status != 200) {
			return false;
		}

		this.usersFriends = await this.getUserFriends();

		return true;
	}

	async updateBlockedIds(newBlockedIds: number[]): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${this.id}`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${this.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({blockedIds: newBlockedIds})
		})

		if (httpResponse.status != 200) {
			return false;
		}

		this.usersBlocked = await this.getBlockedUsers();

		return true;
	}

	async updateUsername(newUsername: string) {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${this.id}`, {
			method: "PATCH",
			headers: {
				"Authorization": `Bearer ${this.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({username: newUsername})
		})
		const response = await httpResponse.json();

		if (httpResponse.status != 200) {
			return { success: false, message: response.message };
		}
        this.username = newUsername;
		return { success: true, message: "" };
	}

	async updateProfileImg(img: FormData): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload/${this.id}`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${this.token}`
			},
			body: img
		})

		if (httpResponse.status != 201) {
			return false;
		}
		const data = await httpResponse.json();

        this.profileImg = `${import.meta.env.VITE_BACKEND_URL}/` + data.profileImg;
		return true;
	}

	async getUsers(): Promise<UserData[] | null> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`,
				"Content-Type": "application/json"
			}
		})
		if (httpResponse.status != 200) {
			return [];
		}
		const users: UserData[] = await httpResponse.json();
		return users;
	}

	async getUsersOnline(): Promise<UserData[]> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/online`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`,
				"Content-Type": "application/json"
			}
		})
		if (httpResponse.status != 200) {
			return [];
		}
		const users: UserData[] = await httpResponse.json();
		return users;
	}

	async getUserOnlineById(id: number): Promise<UserData | null> {
		const users: UserData[] | null = await this.getUsersOnline();
		if (!users)
			return null;
		const user = users.find((user) => user.id == id);
		if (!user)
			return null;
		return user;
	}

	async checkLocalStorage(): Promise<string | null> {
		const localStorageToken = localStorage.getItem("token");

		if (!localStorageToken)
			return null;

		const validToken = await this.validateToken(localStorageToken);

		if (!validToken)
			return null;

		return localStorageToken;
	}

    checkIsLogged(): boolean {
		return this.isLogged;
	}

	hasSubmittedFirstTimeLoginForm(): boolean {
		if (this.username.length > 0)
			return true;
		return false;
	}

	notifyOfUserChange(): void {
		this.socket?.emit("user-updated");
	}

	async isTwoFactorAuthenticationEnabled(): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/2fa/is-enabled`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`
			}
		});
		if (httpResponse.status != 200) {
			return false;
		}
		const isEnabled = await httpResponse.json();
		return isEnabled;
	}

	async checkIfSecondFactorAuthenticationIsNeeded(access_token: string): Promise<boolean> {
		const decodedToken: JwtPayload = jwt_decode(access_token);
		const isTwoFactorAuthEnabled = await this.isTwoFactorAuthenticationEnabled();

		if (isTwoFactorAuthEnabled && !decodedToken.isSecondFactorAuthenticated)
			return true;
		return false;
	}

	async secondFactorAuthenticate(code: string) {
		if (!this.token)
			return { success: false, message: "error while authenticating with 2FA: no token" };

		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/2fa/authenticate`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${this.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({twoFactorAuthenticationCode: code})
		});
		if (httpResponse.status != 200) {
			return { success: false, message: "error while authenticating with 2FA" };
		}

		const { access_token } = await httpResponse.json();

		const authReturn = await this.auth(access_token);
		if (!authReturn.success) {
			return { success: false, message: `error while authenticating with 2FA: ${authReturn.message!}` };
		}
		return { success: true };
	}

	async turnOffTwoFactorAuth(): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/2fa/turn-off`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${user.token}`
			}
		});
		if (httpResponse.status != 200) {
			return false;
		}
		return true;
	}

	async turnOnTwoFactorAuth(code: string): Promise<boolean> {
		const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/2fa/turn-on`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${user.token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({twoFactorAuthenticationCode: code})
		});
		if (httpResponse.status != 200) {
			return false;
		}
		return true;
	}

	async updateUsersOnline() {
		const tmpUsersOnline = await this.getUsersOnline();
		const filteredUsers = tmpUsersOnline?.filter(currentUser => this.id !== currentUser.id);

		if (filteredUsers) {
			this.usersOnline = filteredUsers;
			chat.initChats();
		}
	}

	private onFriendInAGame(friendId: number) {
		const index = this.usersFriends.findIndex(friend => friend.id === friendId);
		if (index != -1)
			this.usersFriends[index].inGame = true;
	}

	private onFriendGameEnded(friendId: number) {
		const index = this.usersFriends.findIndex(friend => friend.id === friendId);
		if (index != -1)
			this.usersFriends[index].inGame = false;
	}

	sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async onConnect() {
		this.socketId = this.socket?.id;
		chat.setEventsHandlers();
		channel.setEventsHandlers();
		await game.setEventHandlers();
		spectator.setEventHandlers();
		notification.setEventHandlers();
		await this.sleep(500);
	}

	onAlreadyConnected(): void {
		this.alreadyConnected = true;
	}

	onDisconnect(): void {
		this.socketId = undefined;
	}

	logout(): void {
		this.socket?.emit('cancel-search');
		this.socket?.emit('cancel-challenge', this.id);
		localStorage.removeItem("token");
		this.token = null;
		this.isLogged = false;
		setTimeout(() => {
			this.socket?.disconnect();
			this.socket = null;
			this.id = -1;
			this.username = '';
		}, 500);
	}
}

export const user = reactive<User>(new User);
