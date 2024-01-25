<template>
  <MainMenu />
  <div class="main-frame">

    <div class="user-profile-container">
      <!-- Recuadro de la foto de perfil -->
      <div class="profile-image">
        <img :src="userData.profileImage" alt="User Avatar" />
      </div>
      <!-- Nombre de usuario y enlace encima del fondo -->
      <div class="user-info">
        <p class="username">{{ userData.name }}</p>
        <router-link to="/profile" class="link">Change profile</router-link>
      </div>
    </div>

    <div class="role-info">
      <p>
        <span class="role-label">Web role:</span>
        <span class="role-value">{{ userData.role }}</span>      
      </p>
      <router-link v-if="userData.role === 'owner' || userData.role === 'admin'" to="/owner" 
        class="access-button">Access web moderation panel</router-link>
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
            <td>{{ userData.wonGames + userData.lostGames }}</td>
            <td>{{ userData.wonGames }}</td>
            <td>{{ userData.lostGames }}</td>
            <td>{{ (userData.wonGames / (userData.wonGames + userData.lostGames) * 100).toFixed(2) }}%</td>
            <td>{{ userData.scoredGoals }}</td>
            <td>{{ userData.receivedGoals }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import MainMenu from "../components/MainMenu.vue";
import { user } from "../user";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "HomePage",
  components: {
    MainMenu,
  },
  setup() {
    const router = useRouter();

    const userData = ref({
      name: user.username,
      profileImage: user.profileImg,
      role: user.role,
      wonGames: user.wonGames,
      lostGames: user.lostGames,
      scoredGoals: user.scoredGoals,
      receivedGoals: user.receivedGoals,
    });

    watch(() => user.wonGames, (newVal) => userData.value.wonGames = newVal);
    watch(() => user.lostGames, (newVal) => userData.value.lostGames = newVal);
    watch(() => user.scoredGoals, (newVal) => userData.value.scoredGoals = newVal);
    watch(() => user.receivedGoals, (newVal) => userData.value.receivedGoals = newVal);

    return {
      userData,
    };
  },
});
</script>

<style scoped>
/* Estilo para el recuadro de la foto de perfil */
.user-profile-container {
  display: flex;
  align-items: center;
  gap: 25px;
  margin-bottom: 20px;
}

.profile-image img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0;
  padding: 0;
}

/* Estilo para el nombre de usuario y el enlace */
.user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.user-info p {
  font-size: 2rem;
  margin: 0px;
  font-weight: bold;
}

.user-info a {
  text-decoration: underline;
  color:#000000 ;
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

.role-info {
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
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

.access-button {
  display: inline-block;
  margin-top: 0px;
  padding: 10px 20px;
  background-color: #f1b307;
  color: white;
  font-weight: bold;
  text-align: center;
  border-radius: 5px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.access-button:hover {
  background-color: #e6a00f;
}

.link {
  text-align: center;
}
</style>