import CensorFiles from './CensorFiles.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { createBetaApp, createBetaView } from '@/plugins';

createBetaApp(createBetaView(CensorFiles), {enableBackend: true, enableEvents: true}).mount('#app');