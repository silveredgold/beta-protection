import {createApp, InjectionKey} from 'vue';
import Statistics from './Statistics.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { backendProviderPlugin } from '@/plugin-backend';

createApp(Statistics).use(backendProviderPlugin).mount('#app')