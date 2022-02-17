import {createApp, InjectionKey} from 'vue';
import Override from './Override.vue';
// General Font
import 'vfonts/Lato.css'
// Monospace Font
import 'vfonts/FiraCode.css'
import { OverrideService } from '@/services/override-service';

const app = createApp(Override);
app.config.unwrapInjectedRef = true;
app.mount("#app");



export const overrideService: InjectionKey<OverrideService|undefined> = Symbol();