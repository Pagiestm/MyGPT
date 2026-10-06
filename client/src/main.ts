import './assets/css/main.css';
import { createApp } from 'vue';
import App from './app/App.vue';
import { registerPlugins } from './app/plugins';

const app = createApp(App);

registerPlugins(app);

app.mount('#app');
