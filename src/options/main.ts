import Options from './Options.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { createBetaApp, createBetaView } from '@/plugins';

createBetaApp(createBetaView(Options), {enableBackend: true, enableEvents: true}).mount('#app')
