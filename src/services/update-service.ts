import { getExtensionVersion } from "@/util"
import { request } from "@octokit/request"
import semver from 'semver';
import browser from 'webextension-polyfill';


export class UpdateService {

    static notifyForBreakingUpdate = async (oldVersion?: string) => {
        oldVersion ??= "your version";
        const updateOpts : chrome.notifications.NotificationOptions<true> = {
                        
            type: 'basic',
            iconUrl: 'images/icon.png',
            title: 'Beta Protection Settings Reset',
            message: `Due to incompatibilities with settings from ${oldVersion}, your Beta Protection settings have been reset to defaults.`,
            contextMessage: 'Open Options to reconfigure any of your preferred settings.',
            priority: 1,
            requireInteraction: false,
        };
        chrome.notifications.create('BP_BREAKING_CHANGE', updateOpts, undefined);
    }

    static checkForUpdates = async () => {
        const currentVersion = getExtensionVersion();
        const allReleases = await request('GET /repos/{owner}/{repo}/releases', {
            owner: 'silveredgold',
            repo: 'beta-protection'
          });
        if (allReleases.status == 200) {
            const latestRelease = allReleases.data.find(r => r.name?.startsWith('v') && r.assets.length > 0);
            const latestVersion = latestRelease?.name;
            if (latestVersion && semver.valid(latestVersion)) {
                // const updateAvailable = semver.gt(latestVersion, currentVersion);
                const updateAvailable = semver.gt(latestVersion, currentVersion);
                if (updateAvailable) {
                    const updateOpts : chrome.notifications.NotificationOptions<true> = {
                        
                        type: 'basic',
                        iconUrl: 'images/icon.png',
                        title: 'Beta Protection Update Available',
                        message: `There is an update to Beta Protection available on GitHub. You are using ${currentVersion}, but ${latestVersion} is available for download.`,
                        priority: 1,
                        buttons: [
                            {title: 'Open on GitHub', iconUrl: 'icons/github.png'}
                        ],
                        requireInteraction: false
                    };
                    chrome.notifications.create('BP_UPDATE_AVAILABLE', updateOpts, undefined);
                }
            }
        }
    }

    static openReleases = () => {
        browser.tabs.create({url: __REPO_URL__ + "releases"});
    }

    static handleNotification = (notificationId: string, buttonIndex?: number) => {
        if (notificationId == 'BP_UPDATE_AVAILABLE') {
            if (buttonIndex === 0) {
                UpdateService.openReleases();
            }
            chrome.notifications.clear('BP_UPDATE_AVAILABLE');
        }
    }
}