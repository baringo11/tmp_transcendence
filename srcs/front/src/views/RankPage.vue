<template>
  <MainMenu />
  <div class="main-frame">
    <h1>Rankings</h1>
    <table class="rankings-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>User</th>
          <th>Win %</th>
          <th>Played</th>
          <th>Won</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(player, index) in rankedPlayers" :key="player.id">
          <td>
            <img v-if="index === 0" :src="firstIcon" alt="First Place" class="position"/>
            <img v-else-if="index === 1" :src="secondIcon" alt="Second Place" class="position"/>
            <img v-else-if="index === 2" :src="thirdIcon" alt="Third Place" class="position"/>
            <span v-else>{{ index + 1 }}</span>
          </td>
          <td>
            {{ player.username }}
            <img :src="profileIcon" alt="Profile" class="profile-icon" @click="viewProfile(player.id)" />
          </td>
          <td>{{ player.victoryPercentage }}%</td>
          <td>{{ player.wonGames + player.lostGames }}</td>
          <td>{{ player.wonGames }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
  
  <script lang="ts">
  import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
  import MainMenu from "../components/MainMenu.vue";
  import { user } from '../user';
  import type { UserData } from '../interfaces';
  import { useRouter } from "vue-router";
  import firstIcon from '@/assets/first-icon.png';
  import secondIcon from '@/assets/second-icon.png';
  import thirdIcon from '@/assets/third-icon.png';
  import profileIcon from '@/assets/profile-icon.png';
  import greenIcon from '@/assets/green-icon.png';
  import redIcon from '@/assets/red-icon.png';
  import orangeIcon from '@/assets/orange-icon.png';
  
  export default defineComponent({
    name: 'RankPage',
    components: {
      MainMenu,
    },
    setup() {
      const rankedPlayers = ref<UserData[]>([]);
      const router = useRouter();

  
      const viewProfile = (userId: number) => {
        router.push({ name: 'others', params: { id: userId } });
      };

      async function loadRankings() {
      try {
        const users = await user.getUsers();
        if (users) {
          users.forEach(user => {
            const totalGames = user.wonGames + user.lostGames;
            user.victoryPercentage = totalGames > 0 ? Math.round((user.wonGames / totalGames) * 100) : 0;
          });

          rankedPlayers.value = users.sort((a, b) => {
            if (b.victoryPercentage === a.victoryPercentage) {
              return b.wonGames - a.wonGames;
            }
            return b.victoryPercentage - a.victoryPercentage;
          });
        }
      } catch (error) {
        console.error("Error loading rankings:", error);
      }
    }
  
      onMounted(() => {
        loadRankings();
        user.socket?.on('rankingsUpdated', async () => {
          await loadRankings();
        });
      });
  
      onUnmounted(() => {
        user.socket?.off('rankingsUpdated');
      });
  
      return { rankedPlayers, firstIcon, secondIcon, thirdIcon, redIcon, orangeIcon, greenIcon, profileIcon, viewProfile};
    },
  });
  </script>

<style scoped>
.rankings-table {
  width: auto; /* Cambiado de 100% a auto para que ocupe el ancho necesario */
  margin: 10px auto; /* Centra la tabla en el contenedor */
  border-collapse: separate; /* Asegura que no haya líneas */
  border-spacing: 0 10px; /* Elimina el espacio entre celdas */
}

.rankings-table th,
.rankings-table td {
  padding: 5px 30px; /* Ajusta este valor según sea necesario */
  text-align: center; /* Centra el texto horizontalmente */
}

.rankings-table th {
  background-color: #f4f4f4;
}

/* Para evitar bordes en la tabla */
.rankings-table th,
.rankings-table td {
  border: none;
}

/* Estilos adicionales para mejorar la legibilidad */
.rankings-table thead th {
  font-weight: bold;
  font-size: 0.9rem;
  background-color: #f1b307;
  font-weight: bold;
  padding: 10px;
}

.rankings-table tbody tr:nth-child(even) {
  background-color: #f9f9f9; /* Agrega un color de fondo para las filas impares si lo deseas */
}

.rankings-table tbody tr:nth-child(odd) {
  background-color: #ffffff;
}

.rankings-table tbody tr:first-child td {
  padding-top: 10px; /* Ajusta según sea necesario */
}

.position {
  height: 30px;
}

.profile-icon {
  height: 20px; /* o el tamaño que prefieras */
  cursor: pointer;
  margin-left: 5px; /* Espacio entre el nombre y el icono */
}
</style>