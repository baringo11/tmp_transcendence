import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class IntraAuthService {
    private _appIntraToken: string;

    constructor(
    ) {
        this.authorizeIntraApp();
    }

    get appIntraToken(): string {
        return this._appIntraToken;
    }

    async getUserIntraToken(code: string, state: string) {
        if (state != process.env.STATE_STRING)
            throw new UnauthorizedException('state strings do not match');

        const postBody = {
            grant_type: 'authorization_code',
            client_id: process.env.INTRA_API_UID,
            client_secret: process.env.INTRA_API_SECRET,
            code: code,
            redirect_uri: `${process.env.FRONTEND_URL}/OauthCallback`,
            state: process.env.STATE_STRING
        };

        const axios = require('axios');
        const httpResponse = await axios.post('https://api.intra.42.fr/oauth/token', postBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (httpResponse.status != 200)
            throw new UnauthorizedException("error while getting user's intra token");

        const response = httpResponse.data;

        const token = response.access_token;
        return token;
    }

    async getUserInfo(token: string) {
        const axios = require('axios');
        const httpResponse = await axios.get('https://api.intra.42.fr/v2/me', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (httpResponse.status != 200)
            throw new UnauthorizedException("error while getting user's info from the intra");
        
        const response = await httpResponse.data;
    
        const userEmail = response.email;
        const intraUsername = response.login;
		const userImageURL = response.image.link;
        
        return { email: userEmail, intraUsername, userImageURL };
    }

    private async authorizeIntraApp(): Promise<void> {
        const postBody = {
            grant_type: 'client_credentials',
            client_id: process.env.INTRA_API_UID,
            client_secret: process.env.INTRA_API_SECRET,
        };

        const axios = require('axios');
        const httpResponse = await axios.post('https://api.intra.42.fr/oauth/token', postBody, {
        headers: {
            'Content-Type': 'application/json'
        }
        });

        if (httpResponse.status != 200){
            throw new UnauthorizedException("error in client credentials flow while authorizing intra app");
        }

        const response = httpResponse.data;
        this._appIntraToken = response.access_token;
    }
}
