import type { Socket } from 'socket.io';
import { UserRole } from 'src/users/interfaces/user-roles';

export interface GatewayUser {
	id: number,
	username: string,
	socket: Socket,
	token: string,
	isGaming: boolean,
	role: UserRole
}