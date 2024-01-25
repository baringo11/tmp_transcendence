import { Controller, Post, UseGuards, Req, Res, HttpCode, Body, Get } from '@nestjs/common';
import { JwtAuthGuard, JwtTwoFactorGuard } from 'src/auth/guards';
import { TwoFactorAuthenticationService } from './two-factor-authentication.service';
import { Response } from 'express';
import { User } from '../users/entities/user.entity';
import { TwoFactorAuthenticationCodeDto } from './dto/two-factor-auth-code.dto';

@Controller('2fa')
export class TwoFactorAuthenticationController {
    constructor(
        private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
    ) {}

    @UseGuards(JwtTwoFactorGuard)
    @Post('generate')
    async generate(@Res() res: Response, @Req() req: Request & { user: User }) {
        const { otpAuthUrl } = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(req.user);
        return this.twoFactorAuthenticationService.pipeQrCodeStream(res, otpAuthUrl);
    }

    @UseGuards(JwtTwoFactorGuard)
    @Post('turn-on')
    @HttpCode(200)
    async turnOnTwoFactorAuthentication(
        @Req() request: Request & { user: User },
        @Body() twoFactorAuthenticationCodeDto: TwoFactorAuthenticationCodeDto
    ) {
        await this.twoFactorAuthenticationService.turnOnTwoFactorAuthentication(request.user, twoFactorAuthenticationCodeDto);
    }

    @UseGuards(JwtTwoFactorGuard)
    @Post('turn-off')
    @HttpCode(200)
    async turnOffTwoFactorAuthentication(@Req() request: Request & { user: User }) {
        await this.twoFactorAuthenticationService.turnOffTwoFactorAuthentication(request.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('authenticate')
    @HttpCode(200)
    async authenticate(
        @Req() request: Request & { user: User },
        @Body() twoFactorAuthenticationCodeDto: TwoFactorAuthenticationCodeDto
    ) {
        return this.twoFactorAuthenticationService.authenticate(request.user, twoFactorAuthenticationCodeDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('is-enabled')
    isEnabled(@Req() request: Request & { user: User }) {
        return this.twoFactorAuthenticationService.isEnabled(request.user);
    }
}
