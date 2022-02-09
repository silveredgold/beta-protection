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

export function isSafe(url: string, safeList: number[]) {
  let chrome = url && url.includes("chrome-extension://");
  let inList = safeList.includes(hashCode(url));
  return chrome || inList;
}

export function isNodeSafe(node: Node, safeList: number[]) {
  let plSrc = node["placeholder-name"] as string;
  let url = node["src"] as string;
  let safeSrc = true;
  if (plSrc) {
    let filename = (url.split('/').pop() ?? '').split('#')[0].split('?')[0];
    safeSrc = filename.toLowerCase() == plSrc.toLowerCase();
  }
  let chrome = url && url.includes("chrome-extension://");
  let inList = safeList.includes(hashCode(url));
  return safeSrc || chrome || inList;
}

export function hashCode(str: string) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @remarks Taken from https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
 * 
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si:boolean=false, dp:number=1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si 
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

export function getRandom<Type>(src: Type[]): Type {
  return src[Math.floor(Math.random()*src.length)]
}

export function generateUUID() { // Public Domain/MIT
  let d = new Date().getTime();//Timestamp
  let d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16;//random number between 0 and 16
      if(d > 0){//Use timestamp until depleted
          r = (d + r)%16 | 0;
          d = Math.floor(d/16);
      } else {//Use microseconds since page-load if supported
          r = (d2 + r)%16 | 0;
          d2 = Math.floor(d2/16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}