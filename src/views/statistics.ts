import Statistics from './Statistics.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { createBetaApp } from '@/plugins';

createBetaApp(Statistics, {enableBackend: true, enableEvents: true}).mount('#app');