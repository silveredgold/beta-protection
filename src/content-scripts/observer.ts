import { isNodeSafe, isSafe } from "@/util";
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
    private _observer: MutationObserver;
    runOnMutate: boolean = true;
    private _hashList: number[];
    private _element?: Node;
    private _options: MutationObserverInit = {childList: true, subtree: true, attributes: true, attributeOldValue : true, attributeFilter: ['src']};

    /**
     * thank god arrays are pass-by-ref or this would be a real PITA
     */
    private constructor(purifier: Purifier, hashList: number[], action?: (mutation: MutationRecord[]) => void) {
        this._purifier = purifier;
        this._observer = new MutationObserver(action ?? this._defaultAction);
        this._hashList = hashList;

    }

    private _defaultAction = (mutations: MutationRecord[]) => {
        console.debug('running default observer action', mutations);
        if (this.runOnMutate) {
            this._purifier.run()
        }

        // Loop that checks for images being replaced after they've been purified, to ensure they are
        // processed again if needed.
        mutations.forEach(mutation => {
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

    stop = () => {
        this._observer.disconnect();
        this._isRunning = false;
    }

    
    private _isRunning : boolean = false;
    public get isRunning() : boolean {
        return this._isRunning;
    }
    
}