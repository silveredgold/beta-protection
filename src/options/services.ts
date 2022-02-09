import { IPreferences } from "@/preferences";
import { InjectionKey, Ref } from "vue";

export const userPrefs: InjectionKey<IPreferences> = Symbol();
export const updateUserPrefs: InjectionKey<(prefs?: IPreferences) => Promise<boolean>> = Symbol();