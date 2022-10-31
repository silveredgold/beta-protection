import Popup from './Popup.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { createBetaApp, createBetaView } from '@/plugins';

createBetaApp(createBetaView(Popup), {enableBackend: true}).mount('#app');