import App from './App.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { createBetaApp, createBetaView } from '@/plugins';

createBetaApp(createBetaView(App), {enableEvents: true}).mount("#app");