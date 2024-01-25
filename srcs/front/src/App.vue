<template>
	<div v-if="user.alreadyConnected"> 
		<AlreadyConnected/>
	</div>
	<div v-else>
		<div class="app-container">
			<div v-if="user.checkIsLogged() && user.hasSubmittedFirstTimeLoginForm()"> </div>
			<div class="app-body">
				<router-view :key="route.path"/>
			</div>
			<div v-if="user.checkIsLogged() && user.hasSubmittedFirstTimeLoginForm()"></div>
		</div>
	</div>
	<NotificationModal />
	<SearchingModal v-if="isSearching"
		:username="searchingUsername"
		:userId="searchingUserId"/>
	<ChallengeModal v-if="isChallenged"
		:fromUsername="challengeUsername"
		:fromUserId="challengeUserId"
    	:gameCustomization="gameCustomization"/>
</template> 

<script setup lang="ts">
  	import { onMounted, ref, watch } from "vue";
	import { user } from "./user";
	import AlreadyConnected from './views/AlreadyConnected.vue';
	import { useRoute } from "vue-router";
	import SearchingModal from './components/SearchingModal.vue';
	import ChallengeModal from './components/ChallengeModal.vue';
	import NotificationModal from './components/NotificationModal.vue';

	const isSearching = ref(false);
	const searchingUsername = ref("");
	const searchingUserId = ref(-1);

	const isChallenged = ref(false);
	const challengeUsername = ref("");
	const challengeUserId = ref(-1);

	const gameCustomization = ref(null);

	function resetValues() {
		searchingUsername.value = "";
		searchingUserId.value = -1;

		challengeUsername.value = "";
		challengeUserId.value = -1;
	}

	onMounted(() => {
		watch(() => user.socket, (newVal) => {
			newVal?.on('start-search', (payload) => {
				if (payload) {
					searchingUsername.value = payload.username;
					searchingUserId.value = payload.id;
				}
				isSearching.value = true;
			});
			newVal?.on('cancel-search', () => {
				isSearching.value = false;
				resetValues();
			});
			newVal?.on('challenge', (payload) => {
				challengeUsername.value = payload.fromUsername;
				challengeUserId.value = payload.fromUserId;
				gameCustomization.value = payload.gameCustomization;
				isChallenged.value = true;
			});
			newVal?.on('challenge-canceled', () => {
				isChallenged.value = false;
				resetValues();
			});
			newVal?.on('challenge-accepted', () => {
				isChallenged.value = false;
				resetValues();
			});
			newVal?.on('challenge-refused', () => {
				isSearching.value = false;
				resetValues();
			});

			newVal?.on('disconnected', (userLeaving) => {
				if (userLeaving.id === challengeUserId.value) {
					isChallenged.value = false;
					resetValues();
				}
				if (userLeaving.id === searchingUserId.value) {
					isSearching.value = false;
					resetValues();
				}
			});
        });
 	});

	const route = useRoute();
</script>

<style scoped>
.app-container {
	box-sizing: border-box;
	max-width: 1200px;
	min-width: 480px;
	padding: 0;
	margin: auto;
	box-sizing: border-box;
	height: 90vh;
}

.app-body {
	box-sizing: border-box;
	height: 80%;
	max-height: 80%;
}
</style> 