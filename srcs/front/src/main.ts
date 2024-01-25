import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import "./styles.css"; // Importa los estilos globales

const app = createApp(App)

app.use(router)

app.mount('#app')
