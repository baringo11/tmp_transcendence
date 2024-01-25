import { IsString, MaxLength, MinLength } from "class-validator";

export class LoginUserDto {
    @IsString()
    @MinLength(1)
    @MaxLength(20)
    username: string;

    @IsString()
    @MinLength(4)
    @MaxLength(50)
    password: string;
}