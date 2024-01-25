import { user } from "../user";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";

export async function firstLoginGuard(
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext
) {
	if (!user.checkIsLogged())
		next({name: "login"});
	else if (user.hasSubmittedFirstTimeLoginForm() === true)
		next({name: "home"});
	else next();
}
