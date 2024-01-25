import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayDisconnect } from '@nestjs/websockets';
import { AppGatewayService } from 'src/app-gateway/appGateway.service';
import { GatewayUser } from 'src/app-gateway/interfaces/gateway-user.interface';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameCustomization, ChallengeUserPayload } from './interfaces/game.interface';

@WebSocketGateway()
export class GameGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private appGatewayService: AppGatewayService,
    private gameService: GameService,
  ) {}

  afterInit(server: Server) {
    this.gameService.server = server;
  }

  handleDisconnect(client: Socket) {
    const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    if (!user)
		  return;
    this.gameService.cancelSearch(user);
    user.socket?.emit('challenge-canceled');
    this.appGatewayService.removeClient(client.id);
  }

  @SubscribeMessage('search-game')
  handleMessage(client: any, gameCustomization: GameCustomization): void {
    const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.searchGame(user, gameCustomization);
  }

  @SubscribeMessage('cancel-search')
  cancelSearch(client: Socket) {
    const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.cancelSearch(user);
  }

  @SubscribeMessage("challenge")
	challenge(client: Socket, payload: ChallengeUserPayload): void {
		const fromUser: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
		this.gameService.challenge(fromUser, payload);
	}

  @SubscribeMessage('accept-challenge')
  challengeGame(client: Socket, payload: ChallengeUserPayload) {
    const challengeduser: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    const challengerUser: GatewayUser = this.appGatewayService.getClientByUserId(payload.toUserId);
    return this.gameService.acceptChallenge(challengeduser, challengerUser, payload.gameCustomization);
  }

  @SubscribeMessage('refuse-challenge')
  refuseChallenge(client: Socket, challengerId: number) {
    const challenger: GatewayUser = this.appGatewayService.getClientByUserId(challengerId);
    const challenged: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.refuseChallenge(challenger, challenged);
  }

  @SubscribeMessage('cancel-challenge')
  cancelChallenge(client: Socket, challengerId: number) {
    const challenger: GatewayUser = this.appGatewayService.getClientByUserId(challengerId);
    const challenged: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.cancelChallenge(challenger, challenged);
  }

  @SubscribeMessage('check-game-continuity')
  playerContinuity(client: Socket, playerId: number) {
    if (this.gameService.isPlayerInAGame(playerId)) {
      const player: GatewayUser = this.appGatewayService.getClientByUserId(playerId);
        this.gameService.joinPlayerToGame(player);
    }
  }

  @SubscribeMessage('spectate-game')
  spectateGame(client: Socket, gameName: string) {
    const spectator: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.joinSpectatorToGame(spectator, gameName);
  }

  @SubscribeMessage('spectate-leave')
  spectateLeave(client: Socket, gameName: string) {
    const spectator: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.deleteSpectatorFromGame(spectator, gameName);
  }

  @SubscribeMessage('end-game-prematurely')
  endGamePrematurely(client: Socket) {
    const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    this.gameService.endGamePrematurely(user.id);
  }

  @SubscribeMessage('getOngoingGames')
  getOngoingGames(client: any): void {
    const user: GatewayUser = this.appGatewayService.getClientBySocketId(client.id);
    if (!user)
      return;
    this.gameService.sendOngoingMatchesToUser(user);
  }
}
