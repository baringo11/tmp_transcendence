import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from './interfaces/user-roles';

@Injectable()
export class UsersService {
  private isOwner: boolean = false;
  private usersOnline: number[] = [];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const usernameExists = await this.findOneByUsername(createUserDto.username);
    if (usernameExists) {
      throw new BadRequestException(
        'Username already in use. Please choose a different one.',
      );
    }

    try {
      const newUser = { ...createUserDto };
      const user = await this.usersRepository.save(newUser);
      const { password, ...result } = user;
      return result;
    } catch (e) {
      throw new BadRequestException('Failed to create user');
    }
  }

  async thereIsOwner() {
    const allUsers = await this.findAll();
    return allUsers.find(user => user.role == UserRole.OWNER);
  }

  async createWithIntra(intraUsername: string) {
    try {
      let newUser;
      if (!this.isOwner && await this.thereIsOwner() === undefined){
        newUser = {username: '', intraUsername, password: '', role: UserRole.OWNER};
        this.isOwner = true;
      } else {
        newUser = {username: '', intraUsername, password: ''};
      }
      const user = await this.usersRepository.save(newUser);
      return user;
    } catch (e) {
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.filter(user => user.username != "");
  }

  async getUsersOnline() {
    const users: User[] = await this.findAll();
    const usersPwd = users.map(({ password, ...userWithoutPwd }) => userWithoutPwd);

    return usersPwd.filter(user => this.usersOnline.includes(user.id));
  }

  async getUsersFriends(id: number) {
    const users: User[] = await this.findAll();
    const usersPwd = users.map(({ password, ...userWithoutPwd }) => userWithoutPwd);
    const userAsking: User = await this.findOneById(id);
    let userFriends = usersPwd.filter(currentUser => userAsking?.friendsIds.includes(currentUser.id));

    return  userFriends.map(friend => ({ ...friend, inGame: false }));
  }

  async getOnlineFriends(id: number) {
    const friends = await this.getUsersFriends(id);

    return friends?.filter(friend => this.usersOnline.includes(friend.id));
  }

  async usersAreFriends(firstUserId: number, secondUserId: number): Promise<boolean> {
    const firstUser: User = await this.findOneById(firstUserId);
    const secondUser: User = await this.findOneById(secondUserId);

    if (firstUser.friendsIds.find((friendId) => friendId == secondUserId) && secondUser.friendsIds.find((friendId) => friendId == firstUserId))
      return true;
    return false;
  }

  async getBlockedUsers(id: number) {
    const users: User[] = await this.findAll();
    const usersPwd = users.map(({ password, ...userWithoutPwd }) => userWithoutPwd);
    const userAsking: User = await this.findOneById(id);

    return  usersPwd.filter(currentUser => userAsking?.blockedIds.includes(currentUser.id));
  }

  addUserOnline(id: number) {
    this.usersOnline.push(id);
  }

  subtractUserOnline(id: number) {
    const index = this.usersOnline.indexOf(id);

    if (index !== -1) {
      this.usersOnline.splice(index, 1);
    }
  }

  findOneById(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id: id });
  }

  async findOneByUsername(username: string): Promise<User> {
    return await this.usersRepository.findOneBy({ username: username });
  }

  async findOneByIntraUsername(intraUsername: string): Promise<User> {
    return await this.usersRepository.findOneBy({ intraUsername: intraUsername });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const userToUpdate = {
      id,
      ...updateUserDto,
    };

    if (updateUserDto.username) {
      const usernameExists = await this.findOneByUsername(updateUserDto.username);
      if (usernameExists && usernameExists.id != id) {
        throw new BadRequestException(
          'Username already in use. Please choose a different one.',
        );
      };
    }
    if (updateUserDto.wonGames || updateUserDto.lostGames) {
      const user = await this.findOneById(id);
      if (!user)
        return;
      userToUpdate.wonGames = user.wonGames + userToUpdate.wonGames;
      userToUpdate.lostGames = user.lostGames + userToUpdate.lostGames;
      userToUpdate.scoredGoals = user.scoredGoals + userToUpdate.scoredGoals;
      userToUpdate.receivedGoals = user.receivedGoals + userToUpdate.receivedGoals;
    }

    try {
      const user = await this.usersRepository.preload(userToUpdate);
      if (user) {
        const res = await this.usersRepository.save(user);
        return res; 
      }
    } catch (e) {
      throw new BadRequestException('Failed to update user');
    }
    throw new NotFoundException();
  }

  async updateRole(id: number, newRoleDto: UpdateUserRoleDto) {
    const userToUpdate = { id, ...newRoleDto };

    try {
      const user = await this.usersRepository.preload(userToUpdate);
      if (user) {
        const res = await this.usersRepository.save(user);
        return res;
      }
    } catch (e) {
      throw new BadRequestException('Failed to update user role');
    }
    throw new NotFoundException();
}

async banFromWebsite(id: number) {
  const userToUpdate = { id, isBanned: true };

  try {
    const user = await this.usersRepository.preload(userToUpdate);
    if (user) {
      const res = await this.usersRepository.save(user);
      return res;
    }
  } catch (e) {
    throw new BadRequestException('Failed to ban user');
  }
  throw new NotFoundException();
}

async unbanFromWebsite(id: number) {
  const userToUpdate = { id, isBanned: false };

  try {
    const user = await this.usersRepository.preload(userToUpdate);
    if (user) {
      const res = await this.usersRepository.save(user);
      return res;
    }
  } catch (e) {
    throw new BadRequestException('Failed to unban user');
  }
  throw new NotFoundException();
}

async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
  if (!(await this.findOneById(userId)))
    throw new NotFoundException();

  return this.usersRepository.update(userId, {
    twoFactorToken: secret
  });
}

async turnOnTwoFactorAuthentication(userId: number) {
  if (!(await this.findOneById(userId)))
    throw new NotFoundException();

  return this.usersRepository.update(userId, {
    twoFactorAuthentication: true
  });
}

async turnOffTwoFactorAuthentication(userId: number) {
  if (!(await this.findOneById(userId)))
    throw new NotFoundException();

  return this.usersRepository.update(userId, {
    twoFactorAuthentication: false
  });
}

}