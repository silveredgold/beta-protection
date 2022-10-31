import { InjectionKey } from 'vue';
import Override from './Override.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { OverrideService } from '@/services/override-service';
import { createBetaApp, createBetaView } from '@/plugins';

const app = createBetaApp(createBetaView(Override), {unwrapInjected: true}).mount('#app');



export const overrideService: InjectionKey<OverrideService|undefined> = Symbol();