import { defaultPrefs, IPreferences, OperationMode } from '@silveredgold/beta-shared/preferences';

export * from '@silveredgold/beta-shared/preferences';
export type {IPreferences, BodyCensorModes} from '@silveredgold/beta-shared/preferences';
export * from './util';

export type SubliminalOptions = {
    enabled: boolean;
    delay: number;
    duration: number;
    ignoreCensorState: boolean;
}

export type LoadingFilterOptions = {
  enabled: boolean;
  blurLevel: number;
  useAsPlaceholder: boolean;
}

export type IExtensionPreferences = IPreferences & {
    // mode: OperationMode;
    gifsAsVideos: boolean;
    enabledPlaceholders: string[];
    subliminal: SubliminalOptions;
    allowList: string[];
    forceList: string[];
    loadingFilter: LoadingFilterOptions;
}

export const defaultExtensionPrefs: IExtensionPreferences = {
    ...defaultPrefs,
    allowList: [],
    forceList: [],
    errorMode: 'normal',
    subliminal: {
        enabled: false,
        delay: 4000,
        duration: 250,
        ignoreCensorState: false
    },
    enabledPlaceholders: [],
    gifsAsVideos: true,
    loadingFilter: {
      blurLevel: 10,
      enabled: true,
      useAsPlaceholder: false
    }
}
