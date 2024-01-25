<template>
    <div class="modal" v-if="isVisible">
        <div class="modal-content">
          <div class="modal-header">
              <h2>{{ channelName }}</h2>
              <button class="close-modal" @click="close()">&times;</button>
          </div>
          <div class="chat-messages">
            <div v-for="(message, index) in messages" :key="index" class="message">
              <div>  {{message.from.username }}: {{ message.message }}</div>
            </div>
          </div>
        </div>
    </div>
</template>
  
<script>
import { watch} from 'vue';
import { user } from '../user';

  export default {
    name: "SeeChatModal",
    props: {
      isVisible: Boolean,
      channelName: String,
    },
    data() {
      return {
        messages: []
      };
    },
    created(){
      watch(() => this.channelName, (newVal) => {
          user.socket?.emit('getChannelForModerator', newVal);
      });
      user.socket?.on('channelForModerator', (channel) =>  {
        if (channel.name === this.channelName) {
          channel.messages.forEach(message => {
            this.messages.push(message);
          });
        }
      });
      user.socket?.on('channelMessageForModerator', (message) =>  {
        if (message.channel === this.channelName) {
          this.messages.push(message);
        }
      });
    },
    methods: {
      close() {
        this.messages = [];
        this.$emit('close')
      }
    }
  };
</script>
 
<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo semitransparente */
  z-index: 1000; /* Asegúrate de que esto esté por encima de otros elementos */
}
  
.modal-content {
  position: relative; /* Esta posición es relativa para el botón de cerrar absoluto */
  width: 450px;
  height: 600px;
  background-color: white; /* Fondo sólido para el contenido */
  padding: 30px 35px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Una sombra ligera para dar profundidad */
  display: flex;
  flex-direction: column;
  justify-content: start; /* Alinea el contenido al principio */
  align-items: center; /* Centra el contenido horizontalmente */
  z-index: 1001; /* Por encima del fondo semitransparente */
}
.modal-header {
  width: 100%;
  margin-bottom: 30px; /* Añade un margen inferior para separar del contenido */
}
.close-modal {
    position: absolute;
    top: 5px;
    right: 5px;
    border: solid 2px #464545;
    background-color: #c7c7c7;
    font-size: 1em;
    cursor: pointer;
    z-index: 2;
  }

.modal-header h2 {
  width: calc(100% - 40px); /* Ajusta al 100% del ancho del contenedor menos el padding */
  background-color: #e6a00f; /* Fondo naranja que ya tienes */
  padding: 10px 20px; /* Añade padding para el título */
  margin: 20px 0 0 0; /* Elimina márgenes por defecto del h2 */
  font-size: 25px;
  text-align: center;
}
.chat-messages {
  width: 100%;
  overflow-y: auto; /* Permite desplazamiento vertical si es necesario */
  margin-bottom: 20px; /* Añade un margen inferior si quieres espacio debajo del chat */
}

.message {
  width: 100%;
  margin-bottom: 10px; /* Espacio entre mensajes */
  padding: 5px; /* Opcional: Añade padding dentro del mensaje */
  box-sizing: border-box; /* Asegura que el padding no aumente el ancho */
}
</style>