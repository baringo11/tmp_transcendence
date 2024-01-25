import { user } from "../user";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";

export async function authenticationGuard(
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext
) {
	if (!user.checkIsLogged())
		next({name: "login"});
	else if (user.hasSubmittedFirstTimeLoginForm() === false)
		next({name: "first-login"});
	else next();
}
