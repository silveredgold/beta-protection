import {createApp, InjectionKey} from 'vue';
import Statistics from './Statistics.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'

createApp(Statistics).mount("#app");

export const reloadStatistics: InjectionKey<() => Promise<boolean>> = Symbol();