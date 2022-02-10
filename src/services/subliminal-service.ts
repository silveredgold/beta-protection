import { CSSManager } from "@/content-scripts/cssManager";
import { IPreferences, loadPreferencesFromStorage, OperationMode, SubliminalOptions } from "@/preferences";
import { DbClient } from "./db-client";

const dbg = (...data: any[]) => {
    console.log(...data);
}

export class SubliminalService {
    /**
     *
     */
    constructor() {
    }

    static loadFromText = (rawText: string) => {
        const lines = rawText.split(/\r?\n/);
        const records: SubliminalMessage[] = [];
        for (const line of lines) {
            if (line) {
                const match = line.match(/(?<count>\d)?:?(?<message>.*)/i);
                if (match && match.groups) {
                    records.push({
                        message: match.groups['message'],
                        weight: parseInt(match.groups['count'] ?? '1')
                    });
                }
            }
        }
        return records;
    }

    loadMessages = async (msgs: SubliminalMessage[], keepExisting: boolean = false) => {
        const db = await DbClient.create();
        if (!keepExisting) {
            await db.purgeMessages();
        }
        await db.addMessages(msgs);
    }

    getMessages = async () => {
        const db = await DbClient.create();
        const results = await db.getSubliminalMessages();
        if (results && results.length > 0) {
            return results.flatMap(r => {
                const instances: string[] = [];
                for (let count = 0; count < (r.weight ?? 1); count++) {
                    instances.push(r.message);
                }
                return instances;
            });
        } else {
            return defaultMessages;
        }
    }

    injectSubliminalScript = async (tab: chrome.tabs.Tab) => {

        const prefs = await loadPreferencesFromStorage();
        const msgs = await this.getMessages();
        if (prefs?.subliminal?.enabled && tab.id) {
            dbg('sub: initializing subliminals for tab', tab);
            const css = new CSSManager(tab.id, prefs);
            dbg(`injecting CSS to ${tab.id}`, prefs);
            await css.removeSubliminal();
            await css.addSubliminal();
            const result = await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id,
                    allFrames: false
                },
                func: this.runSubliminal,
                args: [prefs, msgs]
            });
        }
    }

    private runSubliminal = (prefs: IPreferences, messages: string[]) => {

        


        const opts = prefs.subliminal;
        console.log('sub: running subliminal', opts)
        const msgNode = document.createElement("DIV");
        msgNode.id = 'subliminal';
        document.body.appendChild(msgNode);

        if (messages.length > 0) {
            return setInterval(() => {
                console.log('sub: running interval');
                const seed = Math.floor(Math.random() * messages.length);
                const subEl = document.getElementById("subliminal");
                if (subEl) {
                    subEl.innerText = messages[seed];
                    setTimeout(() => {
                        console.log('sub: running timeout');
                        const subEl = document.getElementById("subliminal");
                        if (subEl) {
                            subEl.innerText = "";
                        }
                    }, opts.duration);
                }
            }, opts.delay);
        }
    }
}

export type SubliminalMessage = {
    weight?: number;
    message: string;
    // category?: string;
    id?: number;
}

const defaultMessages: string[] = [
    "I am a virgin loser.",
    "No Woman would ever fuck me.",
    "Pretty Vaginas are for Real Men only.",
    "Perky Breasts are for Real Men only.",
    "Female affection is not for losers.",
    "Pretty Pussy is not for losers.",
    "Firm supple Titties are not for losers.",
    "Physical contact with Women is not for losers.",
    "I am a pussyfree loser for life.",
    "I am a virgin reject for life.",
    "All losers are virgins and all virgins are losers.",
    "I embrace my virginity and accept it for all eternity.",
    "The word unfuckable enters Womens minds as soon as they see me.",
    "Women know that I am a virgin.",
    "My virginity is assumed by all Women.",
    "Women are glad that I know my place.",
    "Women are happy about my virginity.",
    "Pretty Girls want me to stay virgin like a good obedient beta.",
    "No Woman wants me to ever get to fuck Pussy.",
    "Women know the difference between Men and losers.",
    "Women know that my loser dick has never gotten any pussy.",
    "Women can tell that I'm a virgin just by looking at me.",
    "Pretty Girls love to abuse losers and teach them about reality.",
    "I thank Women for their honesty like a good obedient beta.",
    "Cruelty is honesty and abuse is reality.",
    "No Woman would ever want to touch me, let alone fuck me.",
    "Pretty Vaginas moisten and tingle for Real Men.",
    "Pretty Vaginas dry up around low life losers like me.",
    "Women do not even consider me for sex.",
    "Women reject me with their eyes.",
    "Women are for Real Men only.",
    "Pussy is for Real Men only.",
    "Titties are for Real Men only.",
    "I don't get to fuck any Pussy.",
    "I don't get to grope, squeeze and fondle precious perky Titties.",
    "My tiny penis does not get sucked.",
    "Pretty Girls don't like me.",
    "No Woman would ever let my loser dick anywhere near Her perfect little Pussy.",
    "No Woman would let my little dicklet anywhere near Her pretty Mouth.",
    "Pretty Girls don't want me."
];