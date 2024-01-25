import { user } from "../user";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";

export async function loggedUserGuard(
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext
) {
	if (user.checkIsLogged() && !user.hasSubmittedFirstTimeLoginForm())
		next({name: "first-login"});
	else if (user.checkIsLogged())
		next({name: "home"});
	else next();
}
