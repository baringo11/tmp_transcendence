<template>
  <header class="menu">
    <div class="menu-left">
      <router-link to="/" class="app-name">Simple PONG</router-link>
      <div class="menu-sandwich" v-show="isMobileView">
        <button class="button-sandwich" @click="toggleMobileMenu">☰</button>
      </div>
    </div>
    <div class="menu-center" v-show="isMobileMenuOpen">
      <router-link :to="gameRoute" class="button">Play</router-link>
      <router-link to="/game-list" class="button">Games</router-link>
      <router-link to="/chat" class="button">Chat</router-link>
      <router-link to="/rank" class="button">Rank</router-link>
    </div>
    <div class="menu-right" v-show="isMobileMenuOpen">
      <div class="user-avatar">
        <router-link to="/profile">
          <img
            :src="user.profileImage"
            alt="User avatar image"
            class="avatar-image"
          />
        </router-link>
      </div>
      <div>
        <router-link to="/profile" class="user-name">
          <p>{{ user.name }}</p>
        </router-link>
      </div>
      <div class="logout-icon-box">
        <img
          class="logout-icon"
          @click="user.logout"
          src="@/assets/logout_icon.png"
          alt="Logout icon"
          style="width: 24px; height: 24px"
        />
      </div>
    </div>
  </header>
</template>


<script lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount, toRefs } from 'vue';
import { user } from "../user";
import router from "@/router";
import { game, GameState } from "../game";

export default {
  name: "MainMenu",
  setup() {
    const state = reactive({
      user: {
        get name() {
          return user.username;
        },
        get profileImage() {
          return user.profileImg;
        },
        logout() {
          user.logout();
          router.replace({ "name": "login" });
        }
      },
      isMobileMenuOpen: false,
      isMobileView: false,
    });

    const gameRoute = computed(() => {
      return game.state === GameState.Playing ? '/competitive' : '/game-config';
    });

    const handleResize = () => {
      state.isMobileView = window.innerWidth <= 1000;
      
      // Si la vista ya no es móvil, asegurarnos de que el menú esté abierto
      if (state.isMobileView) {
        state.isMobileMenuOpen = false;
      } else {
        state.isMobileMenuOpen = true;
      }
    };

    const toggleMobileMenu = () => {
      if (state.isMobileView) {
        state.isMobileMenuOpen = !state.isMobileMenuOpen;
      }
    };

    onMounted(() => {
      handleResize();
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });

    return {
      ...toRefs(state),
      gameRoute,
      toggleMobileMenu
    };
  }
};
</script>

<style scoped>
.menu {
  display: flex;
  flex-wrap: wrap;
  padding: 0px 0px;
  justify-content: center;
  background-color: #ffffff;
  color: #000000;
}

.menu-left {
  display: flex;
  align-items: center;
}

.app-name {
  font-size: 30px;
  font-weight: bold;
  color:#000000;
}

/* Estilos para el menú sándwich */
.menu-sandwich {
  display: none;
}

/* Media query para pantallas pequeñas */
@media (max-width: 1000px) {
  .menu {
    display: flex; /* o 'block', dependiendo de cómo quieras que se muestren los elementos */
    flex-direction: column; /* Si usas flex, esto alinea los elementos verticalmente */
    width: 95%; /* Ajusta el ancho según tus necesidades */
    align-items: center; /* Centra los elementos si estás usando flex */
    /* Añade cualquier otro estilo necesario para estos elementos */
    padding: 0px 10px 20px 10px;
  }

  .menu-center, .menu-left, .menu-right {
    display: flex;
    align-items: center;
    padding: 0px 0px 20px 0px !important;
  }

  .menu-sandwich {
    display: block;
    padding: 10px 0  0 60px;
    /* Ajusta el estilo según tus necesidades */
  }

  .app-name {
  font-size: 30px;
  font-weight: bold;
  padding-top: 10px;
  }

  .button-sandwich {
    width: 45px;
    height: 40px;
  }
}
.menu-center, .menu-left, .menu-right {
  display: flex;
  align-items: center;
  padding: 10px 30px 20px 30px;
}

.button {
  font-size: 20px;
  color: #fff;
  padding: 8px 16px;
  margin: 0 10px;
}

.user-avatar {
  padding: 0 10px 0 0;
}

.avatar-image {
  max-width: 50px;
  border-radius: 50%;
}
.user-name {
  color:#000000;
}
.logout-icon-box {
  padding: 0 0 0 35px;
}

.logout-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
}
</style>
