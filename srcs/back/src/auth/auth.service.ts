import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IntraAuthService } from '../intra-auth/intra-auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly intraAuthService: IntraAuthService,
    ) {}
    
    async createUser(createUserDto: CreateUserDto) {
        const newpass = await this.hashPassword(createUserDto.password);
        createUserDto.password = newpass;
        return this.usersService.create(createUserDto);
    }
    
    async validateUser(username: string, pass: string): Promise<User> {
        const user = await this.usersService.findOneByUsername(username);
        if (!user)
            return null;

        const pass_check = await bcrypt.compare(pass, user.password)
        if (pass_check) {
            return user;
        }
        return null;
    }
    
    async login(requestUser: User) {
        const access_token = this.getJwtToken(requestUser.id);
        return { access_token };
    }
    
    async loginWithIntra(code: string, state: string) {
        const intraToken = await this.intraAuthService.getUserIntraToken(code, state);

        const {email, intraUsername, userImageURL} = await this.intraAuthService.getUserInfo(intraToken);
        let userId: number;
        let isFirstLogin = false;

        const foundUser: User = await this.usersService.findOneByIntraUsername(intraUsername);
        if (!foundUser) {
            isFirstLogin = true;
            const createdUser = await this.usersService.createWithIntra(intraUsername);
            userId = createdUser.id;
        }
        else
            userId = foundUser.id;

        const jwtToken = this.getJwtToken(userId);
        
        return { access_token: jwtToken, isFirstLogin };
    }

    getJwtToken(userId: number, isSecondFactorAuthenticated: boolean = false) {
        const payload: JwtPayload = { id: userId, isSecondFactorAuthenticated };
        const access_token = this.jwtService.sign(payload);
        return access_token;
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    }
}
    