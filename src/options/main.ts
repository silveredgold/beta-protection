import { backendProviderPlugin } from '@/plugin-backend';
import {createApp} from 'vue';
import App from './App.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'

createApp(App).use(backendProviderPlugin).mount('#app')
