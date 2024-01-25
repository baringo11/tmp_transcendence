<template>
  <MainMenu /><!-- Inserta componente MainMenu -->
  <div class="main-frame">
    <!-- Contenedor para la foto de perfil y el nombre -->
    <div class="profile-container">
      <!-- Recuadro de la foto de perfil -->
      <div class="profile-image-container">
        <div class="profile-image">
          <img :src=usuario.profileImage alt="User Avatar" />
        </div>
        <!-- Ícono de cámara superpuesto -->
        <div class="camera-icon" @click="uploadImage">
          <img src="@/assets/camera-icon.png" alt="Upload image" />
        </div>
        <!-- Input oculto para seleccionar imágenes -->
        <input type="file" ref="fileInput" @change="handleImage" accept=".jpg, .jpeg, .png" style="display: none;" />
      </div>

      <!-- Nombre de usuario -->
      <div class="user-info">
        <p>{{ usuario.name }}</p>
      </div>
    </div>

    <!-- Casilla de verificación para activar/desactivar doble factor de autenticación -->
    <div class="two-factor">
      <label>Enable two factor authentication:</label>
      <input type="checkbox" v-model="wasTwoFactorActivated" @change="toggleTwoFactor"/>
      <div v-if="wasTwoFactorActivated && !twoFactorAuthEnabled">
        <img :src="qrCode">
        <div>
          <input placeholder="ENTER 6 DIGIT CODE" v-model="twoFactorAuthenticationCode">
        </div>
        <div class='error-message'>
          {{ message }}
        </div>
        <button @click="turnOnTwoFactorAuth">send</button>
      </div>
      <div v-if="twoFactorAuthEnabled" :class='messageClass'>
          {{ message }}
      </div>

    </div>

    <!-- Cambiar nombre de usuario -->
    <div class="change-username">
      <div class="username-input">
        <p>Change name:</p>
        <input
          type="text"
          v-model="newUsername"
          placeholder="Insert new name"
        />
      </div>
      <div class="error-message">{{ infoMessage }}</div>
    </div>
    <div class="confirm-changes">
      <button class="button" @click="changeUsername">Confirm</button>
      <div class="no-changes">
        <router-link to="/">Exit without changes</router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref } from "vue";
import MainMenu from "@/components/MainMenu.vue";
import router from "@/router";
import { user } from "../user";

export default defineComponent({
  name: "UserProfile",
  components: {
    MainMenu,
  },
  data() {
    return {
      usuario: {
        name: user.username,
        profileImage: user.profileImg,
      },
      newUsername: "",
      infoMessage: "",
    };
  },
  setup() {
    const wasTwoFactorActivated = ref<boolean>(false);
    const twoFactorAuthEnabled = ref<boolean>(false);
    const qrCode = ref<string>('');
    const twoFactorAuthenticationCode = ref<string>('');
    const message = ref<string>('');
    const messageClass = ref<string>('error-message');

    onBeforeMount(async () => {
      wasTwoFactorActivated.value = await user.isTwoFactorAuthenticationEnabled();
      twoFactorAuthEnabled.value = wasTwoFactorActivated.value;
    });

    return {wasTwoFactorActivated, twoFactorAuthEnabled, qrCode, twoFactorAuthenticationCode, message, messageClass};
  },
  methods: {
    async toggleTwoFactor() {
      if (this.wasTwoFactorActivated)
        this.generateTwoFactorAuthSecret();
      else
        this.turnOffTwoFactorAuth();
    },
    async generateTwoFactorAuthSecret() {
      const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/2fa/generate`, {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${user.token}`
          }
      });
      if (httpResponse.status != 201) {
          this.message = 'Error while generating 2FA secret and getting QR code';
          return;
      }
      const response = await httpResponse.blob();
      this.qrCode = URL.createObjectURL(response);
    },
    async turnOnTwoFactorAuth() {
      const turnedOn: boolean = await user.turnOnTwoFactorAuth(this.twoFactorAuthenticationCode);
      if (!turnedOn) {
        this.message = 'Error while turning on 2FA';
        return;
      }
      await this.secondFactorAuthenticate();
    },
    async secondFactorAuthenticate() {
      const code = this.twoFactorAuthenticationCode;
      const authenticated = await user.secondFactorAuthenticate(code);
      if (!authenticated.success) {
          this.message = authenticated.message!;
          return;
      }
      this.message = "You have successfully activated 2FA!";
      this.messageClass = 'success-message'
      this.twoFactorAuthEnabled = true;
    },
    async turnOffTwoFactorAuth() {
      const turnedOff: boolean = await user.turnOffTwoFactorAuth();
      if (!turnedOff) {
          this.message = 'Error while turning off 2FA';
          return;
      }
      this.twoFactorAuthEnabled = false;
    },
    uploadImage() {
        // Activar la selección del archivo
        (this.$refs.fileInput as HTMLInputElement).click();
    },
    handleImage(event: Event) {
      const files = (event.target as HTMLInputElement).files;
      if (!files) return;

      const file = files[0];

      // Validar tipo de archivo
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert('Image should be JPG or PNG.');
        return;
      }

      // Validar tamaño de archivo
      if (file.size > 102400) { // Tamaño máximo 100 Kb = 102.400 bytes
        alert('File should be ligther than 100Kb');
        return;
      }

      // Validar dimensiones de la imagen
      const img = new Image();
      img.onload = () => {
        if (img.width !== img.height) {
          alert('Image should be a square');
        } else {
          // Si pasa todas las validaciones, sube la imagen
          this.uploadToServer(file);
        }
        // Liberar la URL temporal después de su uso
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    },
    async uploadToServer(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await user.updateProfileImg(formData);

        if (response) {
          const oldImg = this.usuario.profileImage.substring(this.usuario.profileImage.indexOf("uploads/") + 8);
          if (oldImg != "default_profile.png") {
            const httpResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload/${user.id}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({imageName: oldImg})
            })
          }
          this.usuario.profileImage = user.profileImg;
        } else {
          console.error("Error uploading image:");
        }
      } catch (error) {
        console.error("Something went wrong when uploading new image:", error);
      }
    },
    async changeUsername() {
      this.infoMessage = "";
      const usernameToUpdate = this.newUsername || this.usuario.name;
      var ret = await user.updateUsername(usernameToUpdate);
      if (ret.success === false)
        return this.infoMessage = ret.message;
      this.usuario.name = usernameToUpdate;
      user.notifyOfUserChange();
      router.replace({ "name": "home"});
    },
  },
});
</script>

<style scoped>
/* Estilo para el contenedor de la foto de perfil y el nombre */
.profile-container {
  display: flex; /* Organiza los elementos en una fila */
  align-items: center; /* Centra verticalmente los elementos */
}

.profile-image-container {
  position: relative; /* Hace que el contenedor sea relativo para que el ícono de la cámara sea absoluto a él */
}

.profile-image {
  /* Estilo para la foto de perfil */
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden; /* Para que el ícono de la cámara quede dentro del círculo */
  margin-right: 10px; /* Espacio entre la foto y el nombre */
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Estilo para el ícono de la cámara */
.camera-icon {
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
}

.camera-icon img {
  width: 30px; /* Tamaño del ícono de la cámara */
  height: 30px;
  border-radius: 50%;
  background-color: white; /* Fondo blanco para el ícono */
}

.user-info {
  /* Estilo para el nombre de usuario */
  font-size: 40px;
  color: #000000cb;
  margin-left: 30px;
}

/* Estilos para la casilla de verificación del doble factor de autenticación */
.two-factor {
  margin-top: 50px;
  display: flex;
  align-items: center;
}

.two-factor label {
  font-weight: bold;
  margin-right: 10px;
  color: #000000cb;
}

/* Estilos para la casilla de verificación */
.two-factor input[type="checkbox"] {
  width: 25px;
  height: 25px;
  margin-right: 10px;
}

/* Estilo para el campo "Cambiar nombre de usuario" */
.username-input {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.username-input p {
  font-weight: bold;
  margin-right: 10px;
  margin-top: 30px;
  width: 50%;
  color: #000000cb;
}

.change-username input[type="text"] {
  padding: 5px;
  margin-top: 12px;
  border: 1px solid #000000cb;
}

.confirm-changes {
  display: flex;
  flex-direction: row;
  margin-top: 50px;
}

.error-message {
        color: #EC3F74;
}
.success-message {
        color: #41fd07;
}
.button {
  font-size: 20px;
}
.no-changes {
  margin: 20px 0 0 20px;
  text-decoration: underline;
}
</style>
