<template>
  <MainMenu />
  <div class="main-frame">
    <!-- Recuadro de la foto de perfil -->
    <div class="profile-image">
        <img v-if="otherUser && otherUser.profileImg" :src="otherUser.profileImg" alt="User Avatar" />
        <p>{{ otherUser.username }}</p>
    </div>
    <div class="role-container">
      <span class="role-label">Status:</span>
      <span class="role-value">{{ userStatus }}</span>
    </div>
    <!-- Tabla de Estadísticas -->
    <div class="stats-table">
      <h2>Statistics</h2>
      <table>
        <thead>
          <tr>
            <th>Played</th>
            <th>Won</th>
            <th>Lost</th>
            <th>Victories</th>
            <th>Scored Goals</th>
            <th>Received Goals</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ otherUser.wonGames + otherUser.lostGames }}</td>
            <td>{{ otherUser.wonGames }}</td>
            <td>{{ otherUser.lostGames }}</td>
            <td>{{ (otherUser.wonGames / (otherUser.wonGames + otherUser.lostGames) * 100).toFixed(2) }}%</td>
            <td>{{ otherUser.scoredGoals }}</td>
            <td>{{ otherUser.receivedGoals }}</td>
          </tr>
        </tbody>
      </table>
    </div>



  </div>
</template>
  
<script lang="ts">
import { defineComponent, onMounted, reactive, computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import MainMenu from '../components/MainMenu.vue';
import { user } from "../user";
import type { UserData } from '../interfaces';

export default defineComponent({
    name: "OthersProfile",
    components: {
        MainMenu,
    },
    setup() {
      const route = useRoute();
      const otherUser = reactive({
        id: 0,
        username: '',
        profileImg: '',
        role: '',
        wonGames: 0,
        lostGames: 0,
        scoredGoals: 0,
        receivedGoals: 0,
        inGame: false
      });
      const isUserOnline = ref(false);

      const userStatus = computed(() => {
        if (isUserOnline.value) {
          return otherUser.inGame ? 'playing' : 'online';
        }
        return 'offline';
      });

      onMounted(async () => {
        const userId = route.params.id;
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
              "Authorization": `Bearer ${user.token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Error al recuperar los datos del usuario');
          }
          const userData = await response.json();

          otherUser.id = userData.id;
          otherUser.username = userData.username;
          otherUser.profileImg = `${import.meta.env.VITE_BACKEND_URL}/${userData.profileImg}`;
          otherUser.role = userData.role;
          otherUser.wonGames = userData.wonGames;
          otherUser.lostGames = userData.lostGames;
          otherUser.scoredGoals = userData.scoredGoals;
          otherUser.receivedGoals = userData.receivedGoals;
          otherUser.inGame = userData.inGame;

          const onlineUser = await user.getUserOnlineById(otherUser.id);
          isUserOnline.value = onlineUser !== null;
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
        }
      });

      return { otherUser, userStatus, isUserOnline };
    },
});
</script>
  
<style scoped>
  /* Estilo para los datos del usuario */
  .profile-image, .user-info {
    text-align: center;
  }
  .profile-image img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
  }
  .profile-image p {
    font-size: 1.6rem;
    margin-bottom: 20px;
    font-weight: bold;
    margin-top: 10px;
  }
    
  /* Estilo para la tabla de estadísticas */
  .stats-table {
    margin-top: 60px;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }
    .stats-table h2 {
    font-size: 25px;
    text-align: center;
    margin-top: 0;
    margin-bottom: 15px;
  }
    .stats-table table {
    width: 100%;
    border-collapse: collapse;
  }
    .stats-table th,
  td {
    padding: 8px 12px;
    text-align: center;
    border: 0px solid #ccc;
  }
    .stats-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
    .stats-table tr:nth-child(even) {
    background-color: #f5f5f5;
  }  
  .stats-table tr:hover {
    background-color: #e0e0e0;
  }
  .role-container {
    margin-top: 20px;
  }
  .role-label {
  font-weight: bold;
  font-size: 1.3rem;
  margin-right: 15px;
}
.role-value {
  font-style:normal;
  font-size: 2rem;
  color: #555;
}
</style>