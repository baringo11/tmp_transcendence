import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'The username must only contain letters and numbers' })
  username: string;

  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password: string;
}
