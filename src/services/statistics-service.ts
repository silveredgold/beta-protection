import { MSG_GET_STATISTICS, MSG_RESET_STATISTICS } from '@/messaging';
import browser from 'webextension-polyfill';

export class StatisticsService {
    private _id: string;

    static parseRaw(rawObj: string): StatisticsData {
        const out: StatisticsData = {};
        const input = rawObj.replace(/^{/, "").replace(/}$/, "");
        const siteObjs = (input ?? "").split(',').map(i => i.trim());
        for (const site of siteObjs.filter(v => !!v)) {
            const siteName = site.split('=')[0];
            const [safe, hardcore, softcore] = site.split('=')[1].split(';');
            out[siteName] = {safe: +safe, hardcore: +hardcore, softcore: +softcore};
        }
        return out;
    }

    /**
     *
     */
    constructor() {
        this._id = `statistics`;
    }

    public getStatistics = async () => {
        return new Promise<StatisticsData>((resolve, reject) => {
            const port = browser.runtime.connect({name: this._id});
            port.onMessage.addListener((msg, port) => {
                if (msg.msg == 'reloadStatistics') {
                    resolve(msg.statistics as StatisticsData);
                } else {
                    reject('wait what');
                }
            });
            port.postMessage({msg: MSG_GET_STATISTICS.event});
        });
    }

    public static resetStatistics = async () => {
        return new Promise<boolean>((resolve, reject) => {
            const port = browser.runtime.connect({name: 'statistics:reset'});
            port.onMessage.addListener((msg, port) => {
                if (msg.msg == 'resetStatistics') {
                    const success = msg.reset as boolean;
                    port.disconnect();
                    resolve(success);
                } else {
                    reject('wait what');
                    port.disconnect();
                }
            });
            port.postMessage({msg: MSG_RESET_STATISTICS.event});
        });
    }

}

export type StatisticsData = {
    [domain: string]: {safe: number, softcore: number, hardcore: number};
}