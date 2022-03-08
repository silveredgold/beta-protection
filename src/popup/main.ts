import App from './App.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { createBetaApp } from '@/plugins';

createBetaApp(App, {enableBackend: true}).mount('#app');