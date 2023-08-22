import { GlobalThemeOverrides } from "naive-ui";
import { IExtensionPreferences, IPreferences, OperationMode } from "./preferences";
import browser from 'webextension-polyfill';
import { hashCode, base64ArrayBuffer, humanFileSize } from "@silveredgold/beta-shared";
import { MD5, enc } from "crypto-js";
export { hashCode, base64ArrayBuffer, humanFileSize };


let _extensionVersion: string;

export function getExtensionVersion(): string {
  if (!_extensionVersion) {
    const manifestData = browser.runtime.getManifest();
    _extensionVersion = manifestData.version;
  }
  return _extensionVersion;
}

export async function getExtensionId(): Promise<string> {
  const idResult = await browser.storage.local.get({ 'installationId': '' });
  if (idResult['installationId']) {
    return idResult['installationId'];
  }
  return '';
}

export async function getStorageUsage(): Promise<{ quota: number, usage: number, db?: number } | undefined> {
  try {
    const storageResp = await navigator.storage.estimate();
    if (!!storageResp && !!storageResp.quota && !!storageResp.usage) {
      return { quota: storageResp.quota, usage: storageResp.usage, db: (storageResp as any).usageDetails?.indexedDB }
    }
  } catch {
    //ignored
  }
  return undefined;
}

export function isValidUrl(url: string) {
  const http = (url.includes("http://") || url.includes("https://") || url.includes("data:image/") || url.includes("file://"));
  return http;
}

export function isGif(url: string) {
  const isGif = url.toLowerCase().includes('.gif') || url.startsWith('data:image/gif');
  return isGif;
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}


export const themeOverrides: GlobalThemeOverrides = { common: { fontWeightStrong: '600' }, Result: { lineHeight: '1.1', titleFontSizeSmall: '24', iconSizeSmall: '48px' } };

export function isNodeExcluded(node: Node, safeList?: number[]) {
  const plSrc = node["placeholder-name"] as string;
  const url = node["src"] as string;
  let safeSrc = true;
  if (plSrc) {
    const filename = (url.split('/').pop() ?? '').split('#')[0].split('?')[0];
    safeSrc = filename.toLowerCase() == plSrc.toLowerCase();
  }
  const isChrome = url && url.includes("extension://"); //edge doesn't use a prefix
  const inList = safeList && safeList.length > 0 ? safeList.includes(hashCode(url)) : true;
  return safeSrc || isChrome || inList;
}

export function isNodeSafe(node: Node) {
  const conditions: boolean[] = [];
  const plSrc = node["placeholder-name"] as string;
  const url = node["src"] as string;
  const origSrc = node["censor-src"] as string;
  const hash = node["censor-hash"] as string;
  const state = node["censor-state"] ?? node["censor-style"];
  if (plSrc) {
    const filename = (url.split('/').pop() ?? '').split('#')[0].split('?')[0];
    conditions.push(filename.toLowerCase() == plSrc.toLowerCase());
  }
  if (state === 'censored' && origSrc) {
    conditions.push(url !== origSrc);
    conditions.push(url.startsWith('data:'))
    conditions.push(MD5(url).toString(enc.Base64) == hash);
  }
  return conditions.every(c => c);
}

export function getRandom<Type>(src: Type[]): Type {
  return src[Math.floor(Math.random() * src.length)]
}

export function generateUUID() { // Public Domain/MIT
  let d = new Date().getTime();//Timestamp
  let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16;//random number between 0 and 16
    if (d > 0) {//Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {//Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export const shouldCensor = (prefs: IExtensionPreferences, url: string): boolean => {
  if (prefs?.mode) {
    // let prefs = confPrefs["preferences"] as IPreferences;
    const mode = prefs.mode;
    const whitelist = prefs.allowList?.length ? prefs.allowList : [];
    const blacklist = prefs.forceList?.length ? prefs.forceList : [];
    dbg(`domain matching`, whitelist, blacklist, url);
    const siteAllowed = whitelist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => url.includes(wle));
    if (siteAllowed || mode == OperationMode.Disabled) {
      return false;
    } else if (mode == OperationMode.OnDemand) {
      const siteForced = blacklist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => url.includes(wle));
      return siteForced;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

export const getDomain = (location: string, prefs?: IPreferences | boolean) => {
  return (typeof prefs === 'boolean' && prefs) || (prefs && prefs.hideDomains)
    ? "unknown.tld"
    : location.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
}

export const dbg = (...data: any[]) => {
  if (__DEBUG__) {
    console.debug(...data);
  }
}

export const dbgLog = (...data: any[]) => {
  if (__DEBUG__) {
    console.log(...data);
  }
}

export const dbgTime = (label: string, id?: string) => {
  if (__DEBUG__) {
    console.time(id ? `${label}:${id}` : label);
  }
}

export const dbgTimeEnd = (label: string, id?: string) => {
  if (__DEBUG__) {
    console.timeEnd(id ? `${label}:${id}` : label);
  }
}

export const setModeBadge = (mode?: OperationMode, tabId?: number) => {
  if (!!mode) {
    const modeDetails = mode == OperationMode.Disabled
      ? { text: '❌', color: 'red', title: 'Disabled' }
      : mode == OperationMode.Enabled
        ? { text: '✔', color: 'green', title: 'Enabled' }
        : { text: '💡', color: 'silver', title: 'On Demand Mode' }

    try {
      if (tabId) {
        browser.action.setBadgeText({ text: modeDetails.text, tabId });
        browser.action.setBadgeBackgroundColor({ color: modeDetails.color, tabId });
        browser.action.setTitle({ title: `Beta Protection - ${modeDetails.title}`, tabId });
      } else {
        browser.action.setBadgeText({ text: modeDetails.text });
        browser.action.setBadgeBackgroundColor({ color: modeDetails.color });
        browser.action.setTitle({ title: `Beta Protection - ${modeDetails.title}` });
      }
    } catch { }
  }
}

export function nameof<TObject>(obj: TObject, key: keyof TObject): string;
export function nameof<TObject>(key: keyof TObject): string;
export function nameof(key1: any, key2?: any): any {
  return key2 ?? key1;
}
