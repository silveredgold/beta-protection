import { getAvailablePlaceholders, getEnabledPlaceholders, loadPreferencesFromStorage } from "@/preferences";
import { IPreferences, OperationMode } from "@/preferences/types";
import { Purifier } from "./purifier";
import { CensoringState, CensoringContext } from "./types";
import { hashCode, shouldCensor } from "@/util";
import { PageObserver } from "./observer";
import { MSG_PLACEHOLDERS_ENABLED } from "@/messaging/placeholders";
import { MSG_INJECT_SUBLIMINAL } from "@/messaging";
import browser from 'webextension-polyfill';
import { CMENU_RECHECK_PAGE, CMENU_REDO_CENSOR } from "@/events";

let lastClickElement: HTMLElement|undefined|null;
const safeList: number[] = [];
let currentContext: CensoringContext|undefined;
let timerId: number|undefined;

const dbg = (...data: any[]) => {
	console.debug(...data);
}

const getCensoringState = async (): Promise<CensoringState> => {
	
	const prefs = await loadPreferencesFromStorage();
	const currentSite = window.location.href.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
	const censorEnabled = shouldCensor(prefs, currentSite);
	dbg('censoring state', censorEnabled);
	return {activeCensoring: censorEnabled};
}

const buildPort = () => {
	const port = browser.runtime.connect();
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
	const confPrefs = await browser.storage.local.get('preferences');
	const preferences = confPrefs['preferences'] as IPreferences;
	const placeholders: any = await browser.runtime.sendMessage({msg: MSG_PLACEHOLDERS_ENABLED.event});
	// const newProm = new Promise(resolve => {
	// 	browser.runtime.sendMessage({msg: MSG_PLACEHOLDERS_ENABLED.event}, resp => resolve(resp));
	// })
	// const placeholders: any = await newProm;
	// console.debug('got placeholder response maybe?', placeholders)
	//TODO; not how that works
	// preferences!.enabledPlaceholders = placeholders.categories;
	const port = buildPort();
	const purifier = new Purifier(state, preferences!.videoCensorMode, window.location, placeholders.allImages, safeList);
	purifier.port = port;
	const context: CensoringContext = {
		state,
		preferences,
		purifier,
		port
	};
	console.debug('built new censoring context', context);
	return context;
}

const _sendMessage = (obj: object, context?: CensoringContext) => {
	const ctx = context ?? currentContext;
	if (ctx?.port) {
		ctx.port.postMessage(obj);
	} else {
		browser.runtime.sendMessage(obj);
	}
}

const injectStyles = async (context: CensoringContext): Promise<CensoringContext> => {
	if(context.state.activeCensoring){
		console.log("Beta Protection - Censoring Enabled!");
		const msg = {msg: 'injectCSS', preferences: context.preferences};
		_sendMessage(msg, context);
	} else {
		console.log("Beta Protection - Not censoring current page.");
	}    
	return context;
}

const prepareEvents = async (context: CensoringContext, runImmediately: boolean = false): Promise<void> => {

	if (!context.observer) {
		const observer = buildObserver(context.purifier);
		if (observer) {
			observer.changeAction = (records) => {
				// context.port.postMessage({msg: 'heartBeat'});
			}
		}
		context.observer = observer;
	}
	// Observe for mutations after page load has completed.
	// if ((context.preferences!.subliminal?.enabled ?? false) && context.state.activeCensoring) {
	// 	runSubliminal(context.preferences!.subliminal);
	// }
	// what if I didn't run this until the background script sent its event?
	// I guess images would be visible while loading?
	// do a run on loading, then start the observer on completed?
	//prepareEvents is the one that watches for the DOM status
	if (context.state.activeCensoring) {
		dbg('censoring enabled, queuing purifier run from prepareEvents');
		context.purifier.run();
	}
}

const buildObserver = (purifier: Purifier) => {
	const observer = PageObserver.create(purifier, safeList);
	return observer;
}

const handleMessage = (request: any, sender?: browser.Runtime.MessageSender) => {
	if(request.msg === CMENU_REDO_CENSOR && lastClickElement) {
		lastClickElement.classList.add("redoRequest");
		const id = lastClickElement.getAttribute('censor-id');
		if (id) {
			const origSrc = lastClickElement.getAttribute('censor-src') ?? lastClickElement.getAttribute('src');
			const domain = window.location.hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()
			const respValue = {src: lastClickElement.getAttribute("src"), id, origSrc, domain};
			dbg('sending getClickedEl response', respValue)
			return respValue;
		} else {
			console.debug('running purifier on single element');
			currentContext?.purifier?.censorImage(lastClickElement as HTMLImageElement, true);
		}
		
	}
	// Results for censor requests here. Set the image in the appropriate element.
	if(request.msg === "setSrc" && request.type === "normal") {
		const requestElement = document.querySelector(`[censor-id="${request.id}"]`)
		if(requestElement){
			// console.log(`finalizing purify for ${requestElement}`)
			requestElement.setAttribute('src', request.censorURL);
			requestElement.setAttribute('censor-state', 'censored');
			requestElement.toggleAttribute('censor-placeholder', false);
			safeList.push(hashCode(request.censorURL));
		}
	} else if(request.msg === "setSrc" && request.type === "BG") {
		dbg(`got background setSrc message! ${request.id}`)
		const requestElement = document.querySelector(`[censor-id="${request.id}"]'`)
		if(requestElement) {
			(requestElement as HTMLElement).style.backgroundImage = "url('" + request.censorURL + "')";
			// console.log(`finalizing BG purify for ${requestElement}`)
			requestElement.setAttribute('censor-style', 'censored');
			requestElement.toggleAttribute('censor-placeholder', false);
			//TODO: should this remove the CSS classes?
			safeList.push(hashCode(request.censorURL));
		}
	} else if (request.msg === CMENU_RECHECK_PAGE) {
		dbg('rechecking page');
		const censored = document.querySelectorAll(`img[censor-placeholder]`);
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
			const censored = document.querySelectorAll(`[censor-state]`)
			for (const element of [...censored]) {
				element.removeAttribute('censor-state');
				element.removeAttribute('censor-exclusion');
			}
			const styles = document.querySelectorAll(`[censor-style]`)
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
	console.log('evt: wiring up page event listeners');
	browser.runtime.onMessage.addListener((req, sender) => {
		handlePageEvent(req, sender);
	});

	document.addEventListener("contextmenu", function(event){
		lastClickElement = event.target as HTMLElement;
	}, true);

	// Receive message from the background script here.
	browser.runtime.onMessage.addListener(function(request, sender) {
		// console.log(`content-script onMessage listener!`);
		handleMessage(request, sender);
	});

	
		
}

const handlePageEvent = (req: any, sender?: browser.Runtime.MessageSender) => {
	// console.log('notified of page event', req);
	if (req.msg === 'pageChanged:complete') {
		console.log('evt: notified of page change, re-running!');
		if (currentContext?.observer && currentContext.state.activeCensoring) {
			console.log('evt: found available observer, starting!');
			currentContext.observer.forceStart(document.body);
		}
		if ((currentContext?.preferences.subliminal?.enabled ?? false) && currentContext?.state.activeCensoring) {
			//this should really be happening as a runtime message from the background script
			// just inject it from there on page load, but that needs a refactor first.
			// that actually requires a lot of info on the background side.
			// this method ties it to the page censoring process, for better *and* worse
			browser.runtime.sendMessage({msg: MSG_INJECT_SUBLIMINAL.event});
		}
		// if (currentContext?.port) {
		// 	console.warn('running port disconnect from pageChanged!');
		// 	currentContext.port.disconnect();
		// }
		// if (currentContext) {
		// 	currentContext.observer?.stop();
		// }
		if (!currentContext) {
			console.log('page loaded, but censoring not complete. Ignoring loaded event!')
		} else {
			// console.log('evt: page change notification triggering censoring run', window.location.href)
			// runCensoringAsync(true).then(ctx => {
			// 	currentContext = ctx;
			// });
		}
		
	} else if (req.msg === 'pageChanged:loading') {
		dbg('evt: notified of page loading!');
		// if (currentContext) {
		// 	currentContext.observer?.stop();
		// }
		// runCensoring(true);
		if (req.url) {
			// this is a page change!
			dbg('Page navigation caught!', req.url, window.location.href);
			if (currentContext?.purifier) {
				dbg('evt: re-running purifier from page nav');
				currentContext.purifier.run();
			} else {
				// console.log('evt: would be re-running censoring from page nav');
				// while runCensoring is triggered from the main loop, this is not needed
				// the content script gets re-inited after a page nav
				// which kicks off the main loop again
				// runCensoringAsync(false).then(ctx => {
				// 	currentContext = ctx;
				// });
			}
			
		} else {
			// this is a new load!
		}
		
	} else if (req.msg === 'socketClosed') {
		console.warn('got socket close event!');
	}
}
async function runCensoringAsync(forceEnable: boolean) {
	const state = await getCensoringState();
	if (forceEnable && !state.activeCensoring) {
		state.activeCensoring = true;
	}
	let ctx = await buildContext(state);
	ctx = await injectStyles(ctx);
	await prepareEvents(ctx, true);
	return ctx;
}

configureListeners();
console.log('evt: running main loop')
runCensoringAsync(false).then(ctx => {
	currentContext = ctx;
	// if (document.body) {
	// 	//if the document isn't ready, the page events will handle this for us
	// 	ctx.observer?.start(document.body);
	// }
});