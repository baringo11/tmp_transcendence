import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import LoginPage from '@/views/LoginPage.vue'
import FirstTimeLogin from '@/views/FirstTimeLogin.vue'
import OauthCallback from '@/components/OauthCallback.vue'
import UserProfile from "@/views/UserProfile.vue";
import PongRules from "@/views/PongRules.vue";
import GameTraining from "@/views/GameTraining.vue";
import GameCompetitive from "@/views/GameCompetitive.vue";
import GameConfig from "@/views/GameConfig.vue";
import ChatPage from "@/views/ChatPage.vue";
import GameList from "@/views/GameList.vue";
import OthersProfile from "@/views/OthersProfile.vue";
import Spectator from "@/views/Spectator.vue";
import OwnerPage from "@/views/OwnerPage.vue";
import RankPage from "@/views/RankPage.vue";
import TwoFactorAuthentication from '../components/TwoFactorAuthentication.vue';

import { authenticationGuard, loggedUserGuard, firstLoginGuard, adminGuard, firstFactorAuthenticationGuard} from '../guards/index';
import { user } from '../user';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    beforeEnter: authenticationGuard
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    beforeEnter: loggedUserGuard
  },
  {
		path: '/first_login',
    name: 'first-login',
		component: FirstTimeLogin,
		beforeEnter: firstLoginGuard
	},
  {
    path: "/OauthCallback",
    component: OauthCallback,
    beforeEnter: loggedUserGuard
  },
  {
    path: "/owner",
    name: "owner_page",
    component: OwnerPage,
    beforeEnter: [authenticationGuard, adminGuard]
  },
  {
    path: "/profile",
    name: "user_profile",
    component: UserProfile,
    beforeEnter: authenticationGuard
  },
  {
    path: "/others/:id",
    name: "others",
    component: OthersProfile,
    beforeEnter: authenticationGuard
  },
  {
    path: "/rules",
    name: "rules",
    component: PongRules, 
    beforeEnter: authenticationGuard
  },
  {
    path: "/rank",
    name: "rank",
    component: RankPage, 
    beforeEnter: authenticationGuard
  },
  {
    path: "/game-config/:opponent?/:opponentId?",
    name: "game_config",
    component: GameConfig,
   // props: true,
    props: routes => ({
      opponent: routes.params.opponent,
      opponentId: parseInt(routes.params.opponentId)
    }),
    beforeEnter: authenticationGuard
  },
  {
    path: "/training",
    name: "training",
    component: GameTraining,
    beforeEnter: authenticationGuard
  },
  {
    path: "/competitive",
    name: "competitive",
    component: GameCompetitive,
    beforeEnter: authenticationGuard
  },
  {
		name: 'spectate',
		path: '/spectate/:matchId',
		component: Spectator,
		beforeEnter: authenticationGuard
	},
  {
    path: "/game-list",
    name: "game_list",
    component: GameList,
    beforeEnter: authenticationGuard
  },
  {
    path: "/chat",
    name: "chat",
    component: ChatPage,
    beforeEnter: authenticationGuard
  },
  {
    name: '2fa-auth',
    path: '/2fa-auth',
    component: TwoFactorAuthentication,
    beforeEnter: firstFactorAuthenticationGuard
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from) => {
	if (user.token) {
		const validToken = await user.validateToken(user.token);
		if (!validToken)
			user.logout();
		return;
	}

	const validLocalStorageToken = await user.checkLocalStorage();
	if (!validLocalStorageToken)
		user.logout();
	else
		await user.auth(validLocalStorageToken);
});

export default router
 