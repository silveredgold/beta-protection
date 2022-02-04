

let _extensionVersion: string;

export function getExtensionVersion(): string {
    if (!_extensionVersion) {
        const manifestData = chrome.runtime.getManifest();
        _extensionVersion = manifestData.version;
    }
    return _extensionVersion;
}