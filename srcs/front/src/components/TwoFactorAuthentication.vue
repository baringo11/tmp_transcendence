<template>
	<div class="form-container">
		<div class="form-header">
			<span>2FA</span>
		</div>
		<form @submit.prevent="secondFactorAuthenticate">
            <p>Check your Google Authenticator App and enter the 6 digit code below:</p>
			<input v-model="twoFactorAuthenticationCode" placeholder="ENTER 6 DIGIT CODE"/>
            <div class="error-message">
                {{ errorMessage }}
            </div>
            <div class="form-buttons">
				<button type="button" @click="moveToLogin">GO BACK TO LOGIN</button>
            	<button type="submit" :selected="true" @click="">AUTHENTICATE</button>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
import router from '../router/index';
import { user } from '../user';
import { ref } from 'vue';

const errorMessage = ref<string>('');

const twoFactorAuthenticationCode = ref<string>('');

async function secondFactorAuthenticate() {
    const code = twoFactorAuthenticationCode.value;
    const authenticated = await user.secondFactorAuthenticate(code);
    if (!authenticated.success) {
        errorMessage.value = authenticated.message!;
        twoFactorAuthenticationCode.value = "";
        return;
    }
	router.replace({ "name": "home"});
}

function moveToLogin() {
    router.push("login");
}

</script>

<style scoped>
.form-container {
	max-width: 700px;
	margin: auto;
	margin-top: 34px;
	border: 4px solid #f1b307;
}

.form-header {
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #fab804ac;
	width: 100%;
	font-size: 34px;
	border-bottom: 4px solid #f1b307;
	padding: 12px;
	box-sizing: border-box;
}

.form-buttons {
	display: flex;
	flex-direction: column;
	margin-top: 24px;
	gap: 24px
}

form {
	padding: 32px;
}

.error-message {
	color: #EC3F74;
}


</style>
