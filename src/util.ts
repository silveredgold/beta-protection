import { GlobalThemeOverrides } from "naive-ui";


let _extensionVersion: string;

export function getExtensionVersion(): string {
    if (!_extensionVersion) {
        const manifestData = chrome.runtime.getManifest();
        _extensionVersion = manifestData.version;
    }
    return _extensionVersion;
}

export function isValidUrl(url: string) {
    const http = (url.includes("http://") || url.includes("https://") || url.includes("data:image/") || url.includes("file://"));
    return http;
}

export function toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }


export const themeOverrides: GlobalThemeOverrides = { common: { fontWeightStrong: '600' }, Result: {lineHeight: '1.1', titleFontSizeSmall: '24', iconSizeSmall: '48px'} };