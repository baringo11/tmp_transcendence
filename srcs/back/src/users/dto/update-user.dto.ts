import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'The username must only contain letters and numbers' })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password?: string;

  @IsOptional()
  intraUsername?: string;

  @IsOptional()
  profileImg?: string;

  @IsOptional()
  friendsIds?: number[];

  @IsOptional()
  blockedIds?: number[];

  @IsOptional()
  wonGames?: number;

  @IsOptional()
  lostGames?: number;

  @IsOptional()
  scoredGoals?: number;

  @IsOptional()
  receivedGoals?: number;
}
