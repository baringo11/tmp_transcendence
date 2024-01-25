import { GatewayUser } from '../app-gateway/interfaces/gateway-user.interface';
import { Message } from "./interfaces/chat.interface";

export default class Channel {
	private _name: string;
	private _users: GatewayUser[] = [];
	private _owner: GatewayUser;
	private _admins: GatewayUser[] = [];
	private _mutedUsersIds: number[] = [];
	private _bannedUsersIds: number[] = [];
	private _password: string = null;
	private _messages: Message[] = [];

	constructor(name: string, owner: GatewayUser) {
		this._name = name;
		this._owner = owner;
		this._admins.push(owner);
		this._users.push(owner);
	}

	addUser(user: GatewayUser): void {
		this._users.push(user);
	}

	removeUser(user: GatewayUser): void {
		this._users = this._users.filter((u) => u.id != user.id);

		if (this._owner.id === user.id && this._users.length >= 1)
		 	this.setOwner(this._users[0]);

		this.unsetAdmin(user);
	}

	setPassword(password: string): void {
		this._password = password;
	}

	unsetPassword(): void {
		this._password = null;
	}

	addMessage(message: Message): void {
		this._messages.push(message);
	}

	hasUser(user: GatewayUser): boolean {
		if (this._users.find((channelUser) => channelUser.id == user.id))
			return true;
		return false;
	}

	setOwner(owner: GatewayUser): void {
		if (!this.hasUser(owner))
			return;
		this._owner = owner;
		this.setAdmin(owner);
	}

	setAdmin(admin: GatewayUser): void {
		if (this.hasUser(admin) && !this.userIsAdmin(admin))
			this._admins.push(admin);
	}

	unsetAdmin(admin: GatewayUser): void {
		if (this.userIsAdmin(admin))
			this._admins = this._admins.filter((user) => user.id != admin.id);
	}

	userIsAdmin(user: GatewayUser): boolean {
		if (this._admins.find((u) => u.id == user.id))
			return true;
		return false;
	}

	muteUser(user: GatewayUser): void {
		if (!this.hasUser(user) && !(user.id in this._mutedUsersIds))
			return;
		this._mutedUsersIds.push(user.id);
	}

	unmuteUser(user: GatewayUser): void {
		this._mutedUsersIds = this._mutedUsersIds.filter((id) => id != user.id);
	}

	userIsMuted(user: GatewayUser): boolean {
		if (this._mutedUsersIds.find((id) => id == user.id))
			return true;
		return false;
	}

	banUser(user: GatewayUser): void {
		if (!this.hasUser(user) && !(user.id in this._bannedUsersIds))
			return;
		this._bannedUsersIds.push(user.id);
	}

	unbanUser(user: GatewayUser): void {
		this._bannedUsersIds = this._bannedUsersIds.filter((id) => id != user.id);
	}

	userIsBanned(user: GatewayUser): boolean {
		if (this._bannedUsersIds.find((id) => id == user.id))
			return true;
		return false;
	}

	get name(): string {
		return this._name;
	}

	get users(): GatewayUser[] {
		return this._users;
	}

	get owner(): GatewayUser {
		return this._owner;
	}

	get admins(): GatewayUser[] {
		return this._admins;
	}

	get mutedUsersIds(): number[] {
		return this._mutedUsersIds;
	}

	get bannedUsersIds(): number[] {
		return this._bannedUsersIds;
	}

	get password(): string {
		return this._password;
	}

	get messages(): Message[] {
		return this._messages;
	}
}