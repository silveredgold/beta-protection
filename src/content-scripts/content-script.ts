import { getAvailablePlaceholders, getEnabledPlaceholders, loadPreferencesFromStorage } from "@/preferences";
import { IPreferences, OperationMode } from "@/preferences/types";
import { PlaceholderService } from "@/services/placeholder-service";
import { WebSocketClient } from "@/transport/webSocketClient";
import { CSSManager } from "./cssManager";
import { Purifier } from "./purifier";
import { runSubliminal } from "./subliminal";
import { CensoringState, CensoringContext } from "./types";
import { hashCode, isSafe } from "@/util";
import { PageObserver } from "./observer";
import { MSG_PLACEHOLDERS_ENABLED } from "@/messaging/placeholders";
import { generateUUID } from "./util";

let lastClickElement: HTMLElement|undefined|null;
let safeList: number[] = [];
let currentContext: CensoringContext|undefined;
let timerId: number|undefined;

const dbg = (...data: any[]) => {
	console.debug(...data);
}

const getCensoringState = async (): Promise<CensoringState> => {
	
	let prefs = await loadPreferencesFromStorage();
	let website = window.location.href.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
	if (prefs?.mode) {
		// let prefs = confPrefs["preferences"] as IPreferences;
		let mode = prefs.mode;
		dbg(`content script found preferences: ${prefs.mode}`)
		let whitelist = prefs.allowList?.length ? prefs.allowList : [];
		let blacklist = prefs.forceList?.length ? prefs.forceList : [];
		dbg(`domain matching`, whitelist, blacklist, website);
		// console.log(`blacklist:`, blacklist);
		let siteAllowed = whitelist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => website.includes(wle));
		if (siteAllowed || mode == OperationMode.Disabled) {
			dbg(`running in disabled mode`);
			return {activeCensoring: false}
		} else if (mode == OperationMode.OnDemand) {
			let siteForced = blacklist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => website.includes(wle));
			dbg(`running in on demand: ${siteForced}`);
			return {activeCensoring: siteForced};
		} else {
			return {activeCensoring: true};
		}
	} else {
		return {activeCensoring: false};
	}
}

const buildPort = () => {
	let port = chrome.runtime.connect();
	port.onMessage.addListener((msg, port) => {
		console.log('got runtime port message in content-script', msg);
		handleMessage(msg, port.sender);
	});
	port.onDisconnect.addListener((port) => {
		console.warn('runtime port disconnected', port);
		if (currentContext) {
			currentContext.port = buildPort();
		}
	});
	return port;
}

const buildContext = async (state: CensoringState): Promise<CensoringContext> => {
	// if (currentContext) {
	// 	try {
	// 	currentContext?.port.disconnect();
	// 	currentContext?.observer?.stop();
	// 	} catch {}
	// }
	let confPrefs = await chrome.storage.local.get('preferences');
	let preferences = confPrefs['preferences'] as IPreferences;
	// let tab = await chrome.tabs.getCurrent();
	// let placeholders = await getAvailablePlaceholders();
	let newProm = new Promise(resolve => {
		chrome.runtime.sendMessage({msg: MSG_PLACEHOLDERS_ENABLED.event}, resp => resolve(resp));
	})
	let placeholders: any = await newProm;
	// console.debug('got placeholder response maybe?', placeholders)
	//TODO; not how that works
	preferences!.enabledPlaceholders = placeholders.categories;
	
	// port.onMessage.addListener((msg, port) => {
		
	// 	handlePageEvent(msg, port.sender);
	// });
	let port = buildPort();
	let purifier = new Purifier(state, preferences!.videoCensorMode, window.location, placeholders.allImages, port);
	let context: CensoringContext = {
		state,
		preferences,
		purifier,
		port
	};
	console.debug('built new censoring context', context);
	return context;
}

const _sendMessage = (obj: object, context?: CensoringContext) => {
	let ctx = context ?? currentContext;
	if (ctx?.port) {
		ctx.port.postMessage(obj);
	} else {
		chrome.runtime.sendMessage(obj);
	}
}

const injectStyles = async (context: CensoringContext): Promise<CensoringContext> => {
	if(context.state.activeCensoring){
		console.log("Beta Protection - Censoring Enabled!");
		let msg = {msg: 'injectCSS', preferences: context.preferences};
		_sendMessage(msg, context);
	} else {
		console.log("Beta Protection - Not censoring current page.");
	}    
	return context;
}

const prepareEvents = async (context: CensoringContext, runImmediately: boolean = false): Promise<void> => {

	if (!context.observer) {
		let observer = buildObserver(context.purifier);
		if (observer) {
			observer.changeAction = (records) => {
				// context.port.postMessage({msg: 'heartBeat'});
			}
		}
		context.observer = observer;
	}
	// Observe for mutations after page load has completed.
	if ((context.preferences!.subliminal?.enabled ?? false) && context.state.activeCensoring) {
		runSubliminal(context.preferences!.subliminal);
	}
	// what if I didn't run this until the background script sent its event?
	// I guess images would be visible while loading?
	// do a run on loading, then start the observer on completed?
	//prepareEvents is the one that watches for the DOM status
	if (context.state.activeCensoring) {
		dbg('censoring enabled, queuing purifier run from prepareEvents');
		context.purifier.run();
		// if (context.observer) {
		// 	context.observer.start(document.body);
		// }
	}
}

const buildObserver = (purifier: Purifier) => {
	const observer = PageObserver.create(purifier, safeList);
	return observer;
}

const handleMessage = (request: any, sender?: chrome.runtime.MessageSender, sendResponse?: (response?: any) => void) => {
	if(request.msg === "getClickedEl" && lastClickElement) {
		lastClickElement.classList.add("redoRequest");
		let id = lastClickElement.getAttribute('censor-id');
		if (id) {
			let origSrc = lastClickElement.getAttribute('censor-src') ?? lastClickElement.getAttribute('src');
			let domain = window.location.hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()
			let respValue = {src: lastClickElement.getAttribute("src"), id, origSrc, domain};
			console.debug('sending getClickedEl response', respValue)
			sendResponse?.(respValue);
		} else {
			console.debug('running purifier on single element');
			currentContext?.purifier?.censorImage(lastClickElement as HTMLImageElement, true);
		}
		
	}
	// Results for censor requests here. Set the image in the appropriate element.
	if(request.msg === "setSrc" && request.type === "normal") {
		// console.debug(`got normal setSrc message! ${request.id}`)
		// if (currentContext?.purifier.messageQueue.includes(request.id)) {
		// 	let idx = currentContext.purifier.messageQueue.indexOf(request.id);
		// 	currentContext.purifier.messageQueue.splice(idx, 1);
		// }
		let requestElement = document.querySelector(`[censor-id="${request.id}"]`)
		if(requestElement){
			// console.log(`finalizing purify for ${requestElement}`)
			requestElement.setAttribute('src', request.censorURL);
			requestElement.setAttribute('censor-state', 'censored');
			requestElement.toggleAttribute('censor-placeholder', false);
			safeList.push(hashCode(request.censorURL));
		}
	} else if(request.msg === "setSrc" && request.type === "BG") {
		console.log(`got background setSrc message! ${request.id}`)
		let requestElement = document.querySelector(`[censor-id="${request.id}"]'`)
		if(requestElement) {
			(requestElement as HTMLElement).style.backgroundImage = "url('" + request.censorURL + "')";
			// console.log(`finalizing BG purify for ${requestElement}`)
			requestElement.setAttribute('censor-style', 'censored');
			requestElement.toggleAttribute('censor-placeholder', false);
			//TODO: should this remove the CSS classes?
			safeList.push(hashCode(request.censorURL));
		}
	} else if (request.msg === "recheckPage") {
		console.log('rechecking page');
		let censored = document.querySelectorAll(`img[censor-placeholder]`);
		for (const placeholder of censored) {
			placeholder.removeAttribute('censor-state');
			placeholder.removeAttribute('censor-style');
			placeholder.removeAttribute('censor-exclusion');
			currentContext?.purifier.censorImage(placeholder as HTMLImageElement, true);
		}

	} else if (request.msg === "enableOnPage") {
		console.log('forcing censored state to on');
		currentContext?.observer?.stop();
		try {
			let censored = document.querySelectorAll(`[censor-state]`)
			for (const element of [...censored]) {
				element.removeAttribute('censor-state');
				element.removeAttribute('censor-exclusion');
			}
			let styles = document.querySelectorAll(`[censor-style]`)
			for (const element of [...styles]) {
				element.removeAttribute('censor-style');
				element.removeAttribute('censor-exclusion');
			}
		} catch {}
		runCensoringAsync(true).then(ctx => {
			currentContext = ctx;
			currentContext.observer?.start(document.body);
		})
	}
}

const configureListeners = () => {
	console.log('wiring up page event listeners');
	chrome.runtime.onMessage.addListener((req, sender) => {
		handlePageEvent(req, sender);
	});

	document.addEventListener("contextmenu", function(event){
		lastClickElement = event.target as HTMLElement;
	}, true);

	// Receive message from the background script here.
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		// console.log(`content-script onMessage listener!`);
		handleMessage(request, sender, sendResponse);
	});

	
		
}

const handlePageEvent = (req: any, sender?: chrome.runtime.MessageSender) => {
	// console.log('notified of page event', req);
	if (req.msg === 'pageChanged:complete') {
		console.log('evt: notified of page change, re-running!');
		if (currentContext?.observer && currentContext.state.activeCensoring) {
			console.log('evt: found available observer, starting!');
			currentContext.observer.forceStart(document.body);
		}
		// if (currentContext?.port) {
		// 	console.warn('running port disconnect from pageChanged!');
		// 	currentContext.port.disconnect();
		// }
		// if (currentContext) {
		// 	currentContext.observer?.stop();
		// }
		if (!currentContext) {
			console.warn('censoring not complete, ignoring event!')
		} else {
			console.log('evt: page change notification triggering censoring run', window.location.href)
			// runCensoringAsync(true).then(ctx => {
			// 	currentContext = ctx;
			// });
		}
		
	} else if (req.msg === 'pageChanged:loading') {
		console.log('evt: notified of page loading!');
		// if (currentContext) {
		// 	currentContext.observer?.stop();
		// }
		// runCensoring(true);
		if (req.url) {
			// this is a page change!
			console.log('Page navigation caught!');
			runCensoringAsync(false).then(ctx => {
				currentContext = ctx;
			});
		} else {
			// this is a new load!
		}
		
	} else if (req.msg === 'socketClosed') {
		console.warn('got socket close event!');
	}
}
async function runCensoringAsync(forceEnable: boolean) {
	let state = await getCensoringState();
	if (forceEnable && !state.activeCensoring) {
		state.activeCensoring = true;
	}
	let ctx = await buildContext(state);
	ctx = await injectStyles(ctx);
	await prepareEvents(ctx, true);
	return ctx;
}
// getLocalPlaceholder();

// testStorage();

configureListeners();
console.log('evt: running main loop')
runCensoringAsync(false).then(ctx => {
	currentContext = ctx;
	// if (document.body) {
	// 	//if the document isn't ready, the page events will handle this for us
	// 	ctx.observer?.start(document.body);
	// }
});

// loadPlaceholders().then(() => {
// 	configureListeners();
// 	// runCensoring(true);
// });