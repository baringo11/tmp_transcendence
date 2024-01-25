<script setup lang="ts">
    import router from "@/router";
    import { ref } from "vue"
    import { user } from "../user";

    const username = ref("");
    const errorMessage = ref("");

    async function handleSubmit() {
        if (!username.value){
            errorMessage.value = "missing info! please check that you have filled all sections";
            return;
        }

        const usernameUpdated = await user.updateUsername(username.value);

        if (usernameUpdated.success === false) {
            errorMessage.value = usernameUpdated.message;
            return;
        }

        router.replace({ "name": "user_profile"});
    }
</script>

<template>
    <div class="main-frame">
        <div class="form-container">
            <div class="form-header">
                <span>WELCOME TO SIMPLE PONG!</span>
            </div>
            <form @submit.prevent="handleSubmit">
                <p>Since this is your first time...</p>
                
                <div class="username-section">
                    <label>Choose a display username:</label>
                    <input class="text-input" v-model="username" placeholderText="DISPLAY USERNAME..."/>
                </div>

                <div class="error-message">{{ errorMessage }}</div>
                <button :selected="true" type="submit">SEND!</button>
            </form>
        </div>
    </div>
</template>

<style scoped>
	.form-container {
        margin: auto;
        min-width: 500px;
        border: 4px solid #f1b307;
	}

	.form-header {
		text-align: center;
		background-color: #fab804ac;
		font-size: 22px;
        font-weight: bold;
		border-bottom: 4px solid #f1b307;
		padding: 15px;

	}

	form {
		padding: 0 30px 40px 30px;
        display: flex;
        flex-direction: column;
        font-size: 18px;
        font-weight: bold;
	}

    label {
       padding-right: 15px;
       font-weight:normal;
    }

    p {
        padding: 15px;
        text-align: center;
        font-size: 20px;
    }
    
    .username-section {
        display: flex;
        justify-content: center;
    }

	.error-message {
        color: #EC3F74;
    }

    .text-input {
        margin-bottom: 30px;
    }
</style>