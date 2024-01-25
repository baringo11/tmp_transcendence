<script setup lang="ts">
  import { defineComponent } from "vue";
	import router from "@/router";
  import { ref } from "vue"
	import { user } from "../user";
	import { spectator } from "../spectator";

    const loginUsername = ref<string>("");
    const loginPassword = ref<string>("");
    const loginInfoMessage = ref<string>("");
    const registerUsername = ref<string>("");
    const registerPassword = ref<string>("");
    const registerInfoMessage = ref<string>("");
    const messageClass = ref<string>("error-message");

	  async function login() {
      const loginRet = await user.login(loginUsername.value, loginPassword.value);
      if (!loginRet.success) {
        loginInfoMessage.value = loginRet.message!;
        return;
      }
      const accessToken = loginRet.message!;

      const authOk = await user.auth(accessToken);
      if (!authOk.success) {
        loginInfoMessage.value = authOk.message!;
        return;
      }

      if (await user.checkIfSecondFactorAuthenticationIsNeeded(accessToken)){
        router.replace({ "name": "2fa-auth" });
        return;
		  }

      loginInfoMessage.value = "Success";
      messageClass.value = "success-message";
      const isInGame = spectator.isInGame(user.id);
      if (isInGame)
        return ;
      router.replace({ "name": "home"});
    }

	  async function register() {
      const registerRet = await user.register(registerUsername.value, registerPassword.value);
      if (!registerRet.success) {
        registerInfoMessage.value = registerRet.message!;
        return;
      }

      const loginRet = await user.login(registerUsername.value, registerPassword.value);
      if (!loginRet.success) {
        loginInfoMessage.value = loginRet.message!;
        return;
      }
      const accessToken = loginRet.message!;

      const authOk = await user.auth(accessToken);
      if (!authOk.success) {
        loginInfoMessage.value = authOk.message!;
        return;
      }

      router.replace({ "name": "user_profile"});
    }

	  function loginWithIntra() {
      user.loginWithIntra();
    }
</script>

<template>
  <div class="login-page">
    <h1 class="page-title">Simple PONG</h1>
    <img class="animated-gif" src="../assets/pong.gif" alt="Mi GIF Animado" />
    <div class="login-container">
      <form @submit.prevent="login">
        <div class="login-box">
          <p class="box-tittle">Access for registered users</p>
            <input id="login-username" name="loginUsername"
              class="placeholder" type="text" v-model="loginUsername" placeholder="User" />
            <input id="login-password" name="loginPassword"
              class="placeholder" type="password" v-model="loginPassword" placeholder="Password" />
            <div class="error-message">{{ loginInfoMessage }}</div>
          <button class="button">Login</button>
        </div>
      </form>
      <form @submit.prevent="register">
        <div class="login-box">
          <p class="box-tittle">If you are not registered...</p>
            <input id="register-username" name="registerUsername"
              class="placeholder" type="text" v-model="registerUsername" placeholder="User" />
            <input id="register-password" name="registerPassword"
              class="placeholder" type="password" v-model="registerPassword" placeholder="Password" />
            <div :class='messageClass'>{{ registerInfoMessage }}</div>
          <button class="button">Register</button>
        </div>
      </form>
    </div>
    <a @click="loginWithIntra" style="cursor: pointer;">Login with 42 credentials</a>  </div>
</template>

<style scoped>

h1 {
  margin: 35px 0;
}

.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
  background-color: #ffffff6c;
  margin: 0;
  padding: 0;
}

.page-title {
  font-size: 80px;
  color: #f1b307;
}

.animated-gif {
  margin-bottom: 20px;
}

.login-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20px;
  align-items: center;
  justify-content: center;
}

.login-box {
  border: 5px solid #6a6a6a1f;
  border-radius: 15px;
  padding:20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 5px 5px;
  min-width: 250px;
  min-height: 200px;
}

.placeholder {
  text-align: center;
  margin: 5px 0;
}

.box-tittle {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

button {
  font-size: 16px;
  margin-top: 20px;
}
.error-message {
        color: #EC3F74;
    }
.success-message {
        color: #41fd07;
}

a {
  margin-top: 30px;
  text-decoration: underline;
  font-size: 22px;
}
</style>
