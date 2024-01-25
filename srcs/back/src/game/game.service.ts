import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GatewayUser } from 'src/app-gateway/interfaces/gateway-user.interface';
import { Server } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { AppGatewayService } from 'src/app-gateway/appGateway.service';
import Game from './game.class';
import { GameCustomization, ChallengeUserPayload } from './interfaces/game.interface';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

interface Queue {
  gameCustomization: GameCustomization,
  user: GatewayUser
}

@Injectable()
export class GameService {
  public server: Server;
  public ongoingGames: Game[] = [];
  private queue: Queue[] = [];

  constructor(
    private usersService: UsersService,
    private appGatewayService: AppGatewayService
    ) {}

  createGame(user1: GatewayUser, user2: GatewayUser, gameCustomization: GameCustomization) {
    if (this.isPlayerInAGame(user1.id) || this.isPlayerInAGame(user2.id)) {
      console.log("Cannot create game: one of the players is already in a game.");
      return;
    }

    let game: Game;
    game = new Game(user1, user2, this.server, gameCustomization, this.usersService,this.appGatewayService);

    game.setStartGameCallback((gameName: string) => this.onStartGame(gameName));
    game.setEndGameCallback((gameName: string) => this.onEndGame(gameName));
    this.ongoingGames.push(game);
    game.start();
  }

  onStartGame(gameName: string) {
    const game: Game = this.findGameByGameName(gameName);
    this.notifyFriendsOfGameStart(game.players[0].user.id, game.players[1].user.id);
	  this.sendOngoingMatchesToAllUsers();
  }

  async onEndGame(gameName: string) {
    const game: Game = this.findGameByGameName(gameName);
    this.notifyFriendsOfGameEnd(game.players[0].user.id, game.players[1].user.id);
    this.deleteGameFromOngoingGames(gameName);
    this.sendOngoingMatchesToAllUsers();

    let updateStats: UpdateUserDto = {
      wonGames: 0,
      lostGames: 0,
      scoredGoals: 0,
      receivedGoals: 0,
    };

    updateStats.wonGames = game.winner === game.players[0].user.username? 1 : 0;
    updateStats.lostGames = game.winner === game.players[0].user.username? 0 : 1;
    updateStats.scoredGoals = game.players[0].score;
    updateStats.receivedGoals = game.players[1].score;
    await this.usersService.update(game.players[0].user.id, updateStats);
    game.players[0].user.socket.emit("statsUpdated");

    updateStats.wonGames = game.winner === game.players[1].user.username? 1 : 0;
    updateStats.lostGames = game.winner === game.players[1].user.username? 0 : 1;
    updateStats.scoredGoals = game.players[1].score;
    updateStats.receivedGoals = game.players[0].score;
    await this.usersService.update(game.players[1].user.id, updateStats);
    game.players[1].user.socket.emit("statsUpdated");

  }

  private deleteGameFromOngoingGames(gameName: string): void {
    const gameIndex = this.ongoingGames.findIndex(game => game.name == gameName);
    if (gameIndex != -1)
      this.ongoingGames.splice(gameIndex, 1);
  }

  public getOngoingMatches() {
    const games = this.ongoingGames.map((game) => {
      return {
        name: game.name,
        gameCustomization: game.gameCustomization,
        player1: game.players[0].user.username,
        player1Id: game.players[0].user.id,
        player1Score: game.players[0].score,
        player2: game.players[1].user.username,
        player2Id: game.players[1].user.id,
        player2Score: game.players[1].score,
      }
    });

    return games;
  }

  sendOngoingMatchesToUser(client: GatewayUser) {
    client.socket.emit("ongoing-games", this.getOngoingMatches());
  }

  sendOngoingMatchesToAllUsers() {
	  this.server.emit("ongoing-games", this.getOngoingMatches());
  }

  isPlayerInAGame(playerId: number): boolean {
    if (this.findGameByPlayerUserId(playerId))
      return true;
    return false;
  }

  joinPlayerToGame(player: GatewayUser) {
    for (const game of this.ongoingGames) {
      if (player && this.isPlayerInAGame(player.id)) {
        game.rejoinPlayer(player);
        player.socket.emit('start-game', {
          user1: game.players[0].user.username,
          user2: game.players[1].user.username,
        });
      }
    }
  }

  joinSpectatorToGame(spectator: GatewayUser, gameName: string) {
    const gameIndex = this.ongoingGames.findIndex((game) => game.name == gameName);
    if (gameIndex == -1) {
      spectator.socket.emit("spectate-game", false);
      return;
    }

    if (!this.ongoingGames[gameIndex].viewers.find((viewer) => viewer.id === spectator.id)) {
      this.ongoingGames[gameIndex].viewers.push(spectator);
      spectator.socket.join(gameName);
    }
	
    const gameInfo = {
      player1: this.ongoingGames[gameIndex].players[0].user.username,
      player2: this.ongoingGames[gameIndex].players[1].user.username,
      gameDifficult: this.ongoingGames[gameIndex].gameCustomization.gameDifficult,
      winningScore: this.ongoingGames[gameIndex].gameCustomization.winningScore,
    };

    spectator.socket.emit("spectate-game-players", gameInfo);
  }

  deleteSpectatorFromGame(spectator: GatewayUser, gameName: string) {
    const gameIndex = this.ongoingGames.findIndex((game) => game.name == gameName);
    if (gameIndex == -1) {
      spectator.socket.emit("spectate-game", false);
      return;
    }

    const viewerIndex: number = this.ongoingGames[gameIndex].viewers.findIndex(viewer => {
      if (viewer.id == spectator.id)
        return viewer;
    })

    this.ongoingGames[gameIndex].viewers.splice(viewerIndex, 1);

    spectator.socket.leave(gameName);
  }

  findGameByPlayerUserId(playerId: number): Game | undefined {
    const game: Game | undefined = this.ongoingGames.find((game) =>
      (game.players[0].user.id === playerId || game.players[1].user.id === playerId)
    );
    return game;
  }

  findGameByGameName(gameName: string): Game {
    const game: Game = this.ongoingGames.find((game) => game.name == gameName);
    return game;
  }

  findPlayerIndexByGame(playerId: number, game: Game): number {
    if (game.players[0]?.user.id === playerId)
      return 0;
    else if (game.players[1]?.user.id === playerId)
      return 1;
    else
      return -1;
  }

  endGamePrematurely(userId: number): void {
    const game = this.findGameByPlayerUserId(userId);
    if (game) {
      const playerIndex = this.findPlayerIndexByGame(userId, game);
      game.end(playerIndex);
    }
  }

  async notifyFriendsOfGameStart(player0Id: number, player1Id: number) {
    let friends = await this.usersService.getOnlineFriends(player0Id);
    friends.forEach(friend => {
        this.appGatewayService.getClientByUserId(friend.id)?.socket.emit('friend-in-a-game', player0Id);
    });

    friends = await this.usersService.getOnlineFriends(player1Id);
    friends.forEach(friend => {
      this.appGatewayService.getClientByUserId(friend.id)?.socket.emit('friend-in-a-game', player1Id);
    });
  }

  async notifyFriendsOfGameEnd(player0Id: number, player1Id: number) {
    let friends = await this.usersService.getOnlineFriends(player0Id);
    friends.forEach(friend => {
        this.appGatewayService.getClientByUserId(friend.id)?.socket.emit('friend-game-ended', player0Id);
    });
    
    friends = await this.usersService.getOnlineFriends(player1Id);
    friends.forEach(friend => {
        this.appGatewayService.getClientByUserId(friend.id)?.socket.emit('friend-game-ended', player1Id);
    });
  }

  async searchGame(requestor: GatewayUser, gameCustomization: GameCustomization) {
    if (this.queue.find((queue) => queue.user.id === requestor.id)) {
      console.log('player already in a queue');
      return ;
    }

    const newGameToQueue : Queue = {
      gameCustomization: gameCustomization,
      user: requestor
    };

		this.queue.push(newGameToQueue);
    requestor.socket.emit('start-search');
	}

	cancelSearch(playerToRemove: GatewayUser) {
    let index = this.queue.findIndex((item) => item.user.id === playerToRemove.id)
    if (index !== -1) {
      playerToRemove.socket.emit('cancel-search');
      this.queue.splice(index, 1);
    }
	}

  removeFromQueue(userId: number) {
    let index = this.queue.findIndex((item) => item.user.id === userId)
    if (index !== -1)
      this.queue.splice(index, 1);
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
	matchmakingCron() {
    let i = -1;
    while (this.queue.length >= 2 && ++i < this.queue.length) {
      const customization1 = JSON.stringify(this.queue[i].gameCustomization);
      let j = -1;
      while (++j < this.queue.length) {
        if (i !== j) {
          const customization2 = JSON.stringify(this.queue[j].gameCustomization);
          if (customization1 === customization2) {
            const user1 = this.queue[i].user;
            const user2 = this.queue[j].user;
            const game = this.queue[i].gameCustomization;

            this.cancelSearch(user1);
            this.cancelSearch(user2);

			      this.createGame(user1, user2, game);
            i = -1;

            break;
          }
        }
      }
    }
	}

  async challenge(fromUser: GatewayUser, receivedPayload: ChallengeUserPayload): Promise<void> {
		const toUser: GatewayUser = this.appGatewayService.getClientByUserId(receivedPayload.toUserId);

		if (!toUser)
			return;
		if (fromUser.isGaming || toUser.isGaming)
			return;

		const usersAreFriends = await this.usersService.usersAreFriends(fromUser.id, toUser.id);
		if (!usersAreFriends)
			return;

    fromUser.socket.emit('start-search', {username: toUser.username, id: toUser.id});
		toUser.socket.emit('challenge', {fromUsername: fromUser.username,fromUserId: fromUser.id, gameCustomization: receivedPayload.gameCustomization});
	}

  acceptChallenge(challengeduser: GatewayUser, challengeruser: GatewayUser, gameCustomization: GameCustomization): boolean {

    if (this.isPlayerInAGame(challengeruser.id)) {
      return false;
    }

    if (this.isPlayerInAGame(challengeduser.id)) {
      this.endGamePrematurely(challengeduser.id);
    }

    challengeduser.socket.emit('challenge-accepted');
    challengeruser.socket.emit('cancel-search');
    this.createGame(challengeruser, challengeduser, gameCustomization);

    return true;
  }

  refuseChallenge(challenger: GatewayUser, refuser: GatewayUser) {
    challenger.socket.emit('challenge-refused', refuser.username);
    refuser.socket.emit('challenge-canceled');
  }

  cancelChallenge(user1: GatewayUser, user2: GatewayUser) {
    user1.socket.emit('challenge-canceled');
    user2.socket.emit('cancel-search');
  }
}
