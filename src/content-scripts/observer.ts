import { isNodeSafe } from "@/util";
import { Purifier } from "./purifier";


export class PageObserver {

    static create = (purifier: Purifier, safeList: number[]): PageObserver | undefined => {
        if (window.MutationObserver) {
            //yay, setup callback for mutations
            const observer = new PageObserver(purifier, safeList);
            return observer;
        }
        return undefined;;
    }
    private _purifier: Purifier;
    private _observer!: MutationObserver;
    runOnMutate: boolean = true;
    private _hashList: number[];
    private _element?: Node;
    private _options: MutationObserverInit = {childList: true, subtree: true, attributes: true, attributeOldValue : true, attributeFilter: ['src']};
    private _action: ((mutation: MutationRecord[]) => void) | undefined;

    /**
     * thank god arrays are pass-by-ref or this would be a real PITA
     */
    private constructor(purifier: Purifier, hashList: number[], action?: (mutation: MutationRecord[]) => void) {
        this._purifier = purifier;
        this._action = action;
        this._hashList = hashList;
        this.init();
    }

    private init = () => {
        this._observer = new MutationObserver(this._action ?? this._defaultAction);
    }

    private _defaultAction = (mutations: MutationRecord[]) => {
        // console.debug('running default observer action', mutations);
        if (this.runOnMutate) {
            this._purifier.run()
        }

        try {
            if (this._changeAction) {
                this._changeAction(mutations);
            }
        } catch {}

        // Loop that checks for images being replaced after they've been purified, to ensure they are
        // processed again if needed.
        mutations.forEach(mutation => {
            if (mutation.type == "childList" && [...mutation.addedNodes].some(n => n.nodeName == "IFRAME")) {
                console.warn('found an iframe!');
                for (const iframe of [...mutation.addedNodes].filter(n => n.nodeName === 'IFRAME')) {
                    iframe.addEventListener('load', () => {
                        chrome.runtime.sendMessage({'msg': 'injectCSS'});
                    })
                }
            }
            if (mutation.type === "attributes" && mutation.attributeName === "src") {
                let target = mutation.target as Element;
                // let safe = isSafe(mutation.target["src"], this._hashList);
                let safe = isNodeSafe(mutation.target, this._hashList);
                console.debug(`mutation running, checking for safe! ${safe}`, mutation.target);
                if (safe) {
                    // Do nothing since it's safe.
                } else {
                    target.setAttribute('censor-state', 'unsafe')
                    this._purifier.backlog = true;
                }
            }
        });
    }

    attach = (element: Node) => {
        this._element = element;
        return this;
    }

    start = (element?: Node) => {
        if (this._element === undefined && element === undefined) {
            throw new Error("You must attach this observer to a node first!");
        }
        this._observer.observe(this._element ?? element!, this._options);
        this._isRunning = true;

    }

    forceStart = (element: Node) => {
        if (this._observer) {
            try {
                this._observer.disconnect();
            } catch {}
        }
        this.init();
        this._element = element;
        this._observer.observe(this._element, this._options);
        this._isRunning = true;
    }

    stop = () => {
        this._observer.disconnect();
        this._isRunning = false;
    }

    
    private _changeAction : (records: MutationRecord[]) => void = (() => {});
    public get changeAction() : (records: MutationRecord[]) => void {
        return this._changeAction;
    }
    public set changeAction(v : (records: MutationRecord[]) => void) {
        this._changeAction = v;
    }
    

    
    private _isRunning : boolean = false;
    public get isRunning() : boolean {
        return this._isRunning;
    }
    
}