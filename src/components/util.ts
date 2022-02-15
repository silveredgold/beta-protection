import browser from 'webextension-polyfill';

export const openSettings = () => {
    window.open(browser.runtime.getURL('options.html'));
}

export const openStatistics = () => {
    window.open(browser.runtime.getURL('statistics.html'));
}