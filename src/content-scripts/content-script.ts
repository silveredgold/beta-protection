import { Purifier } from "./purifier";
import { CensoringState, CensoringContext } from "./types";
import { getDomain, hashCode, shouldCensor, dbg, dbgLog } from "@/util";
import { PageObserver } from "./observer";
import { MSG_PLACEHOLDERS_ENABLED } from "@/messaging/placeholders";
import { MSG_INJECT_SUBLIMINAL } from "@/messaging";
import browser from 'webextension-polyfill';
import { CMENU_RECHECK_PAGE, CMENU_REDO_CENSOR } from "@/events";
import { getPreferencesStore } from "@/stores/util";

let lastClickElement: HTMLElement|undefined|null;
const safeList: number[] = [];
let currentContext: CensoringContext|undefined;
// const service = PreferencesService.create();
// const store = getPreferencesPlugin();;
// const app = createApp(Container);
//   const pinia = getPinia();
//   setActivePinia(pinia);
//   app.use(pinia);
  // const store = usePreferencesStore(undefined, getPinia());
  const store = getPreferencesStore();
  const service = store.ready;

const getCensoringState = async (): Promise<CensoringState> => {
  await service;
  // const store = await service;
	const currentSite = window.location.href.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
	const censorEnabled = shouldCensor(store.currentPreferences, currentSite);
	dbg('censoring state', censorEnabled);
	return {activeCensoring: censorEnabled};
}

const buildPort = () => {
	const port = browser.runtime.connect();
	port.onMessage.addListener((msg, port) => {
		dbgLog('got runtime port message in content-script', msg);
		handleMessage(msg, port.sender);
	});
	port.onDisconnect.addListener((port) => {
		dbgLog('runtime port disconnected', port);
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
  // const store = await service;
	await service;
	const preferences = store.currentPreferences;
	const placeholders: any = await browser.runtime.sendMessage({msg: MSG_PLACEHOLDERS_ENABLED.event});
	// const newProm = new Promise(resolve => {
	// 	browser.runtime.sendMessage({msg: MSG_PLACEHOLDERS_ENABLED.event}, resp => resolve(resp));
	// })
	// const placeholders: any = await newProm;
	// console.debug('got placeholder response maybe?', placeholders)
	//TODO; not how that works
	// preferences!.enabledPlaceholders = placeholders.categories;
	// const port = buildPort();
	const purifier = new Purifier(state, {videoMode: preferences!.videoCensorMode, gifsAsVideos: !(preferences!.autoAnimate)}, window.location, placeholders.allImages);
	purifier.hideDomains = preferences.hideDomains ?? false;
	// purifier.port = port;
	const context: CensoringContext = {
		state,
		preferences,
		purifier,
		// port
	};
	dbg('built new censoring context', context);
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
		browser.runtime.sendMessage(msg);
	} else {
		console.log("Beta Protection - Not censoring current page.");
    document.addEventListener("DOMContentLoaded", (ev) => {
      dbg('DOM loaded, disabling universal blur');
      document.body.toggleAttribute('censor-disabled', true);
    });
    // const msg = {msg: 'injectCSS:disable', preferences: context.preferences};
		// browser.runtime.sendMessage(msg);
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
	if (context.state.activeCensoring && document.body) {
		dbg('censoring enabled, queuing purifier run from prepareEvents');
		context.purifier.run();
	}
}

const buildObserver = (purifier: Purifier) => {
	const observer = PageObserver.create(purifier);
	if (observer) {observer.runOnMutate = true;}
	return observer;
}

// const onnxCensorImage = async (img: HTMLImageElement, origSrc: string) => {
// 	const fetchBuffer = await browser.runtime.sendMessage({msg: 'getImageData', path: origSrc});
// 	debugger;
// 	const canvas = document.createElement('canvas');
// 	canvas.toggleAttribute('crossorigin');
// 	const context = canvas.getContext('2d');
// 	canvas.width = img.width;
// 	canvas.height = img.height;
// 	context?.drawImage(img, 0, 0 );
// 	// const myData = context?.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
// 	debugger;
// 	const url = canvas.toDataURL();
// 	const svc = await AIService.create();
// 	console.log('got svc', svc, fetchBuffer);
// 	const result = await svc.run(fetchBuffer);
// 	console.log(result);
// 	return result!;
// }

const handleMessage = (request: any, sender?: browser.Runtime.MessageSender) => {
	if(request.msg === CMENU_REDO_CENSOR && lastClickElement) {
		lastClickElement.classList.add("redoRequest");
		const id = lastClickElement.getAttribute('censor-id');
		if (id) {
			const origSrc = lastClickElement.getAttribute('censor-src') ?? lastClickElement.getAttribute('src');
			const domain = getDomain(window.location.hostname, currentContext?.preferences).toLowerCase()
			const respValue = {src: lastClickElement.getAttribute("src"), id, origSrc, domain};
			dbg('sending getClickedEl response', respValue)
			return respValue;
		} else {
			console.debug('running purifier on single element');
			currentContext?.purifier?.censorImage(lastClickElement as HTMLImageElement, true);
			// const origSrc = lastClickElement.getAttribute('censor-src') ?? lastClickElement.getAttribute('src');
			// onnxCensorImage(lastClickElement as HTMLImageElement, origSrc!).then(res => {
			// 	console.log('ai result', res);
			// });
		}

	}
	// Results for censor requests here. Set the image in the appropriate element.
	// if(request.msg === "setSrc" && request.type === "normal") {
	// 	console.warn('global set-src on content script');
	// 	const requestElement = document.querySelector(`[censor-id="${request.id}"]`)
	// 	if(requestElement){
	// 		// console.log(`finalizing purify for ${requestElement}`)
	// 		requestElement.setAttribute('src', request.censorURL);
	// 		requestElement.setAttribute('censor-state', 'censored');
	// 		requestElement.toggleAttribute('censor-placeholder', false);
	// 	}
	// }
	// } else if(request.msg === "setSrc" && request.type === "BG") {
	// 	dbg(`got background setSrc message! ${request.id}`)
	// 	const requestElement = document.querySelector(`[censor-id="${request.id}"]'`)
	// 	if(requestElement) {
	// 		(requestElement as HTMLElement).style.backgroundImage = "url('" + request.censorURL + "')";
	// 		// console.log(`finalizing BG purify for ${requestElement}`)
	// 		requestElement.setAttribute('censor-style', 'censored');
	// 		requestElement.toggleAttribute('censor-placeholder', false);
	// 		//TODO: should this remove the CSS classes?
	// 		addToSafeList(request.censorURL);
	// 	}
	// } else if (request.msg === CMENU_RECHECK_PAGE) {
	if (request.msg === CMENU_RECHECK_PAGE) {
		dbg('rechecking page');
		const censored = document.querySelectorAll(`img[censor-placeholder]`);
		for (const placeholder of censored) {
			placeholder.removeAttribute('censor-state');
			placeholder.removeAttribute('censor-style');
			placeholder.removeAttribute('censor-exclusion');
			currentContext?.purifier.censorImage(placeholder as HTMLImageElement, true);
		}

	} else if (request.msg === "enableOnPage") {
		console.log('Beta Protection = Forcing censored state to on');
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
	dbgLog('evt: wiring up page event listeners');
	browser.runtime.onMessage.addListener((req, sender) => {
		handlePageEvent(req, sender);
	});

	document.addEventListener("contextmenu", function(event){
		lastClickElement = event.target as HTMLElement;
	}, true);

	// Receive message from the background script here.
	browser.runtime.onMessage.addListener(function(request, sender) {
		handleMessage(request, sender);
	});
}

const handlePageEvent = (req: any, sender?: browser.Runtime.MessageSender) => {
	// console.log('notified of page event', req);
	if (req.msg === 'pageChanged:complete') {
		dbgLog('evt: notified of page change, re-running!');
		if (currentContext?.purifier?.ready === true && currentContext?.state.activeCensoring) {
				dbg('censoring enabled, queuing purifier run from handlePageEvent');
				currentContext.purifier.run();
		}
		if (currentContext?.observer && currentContext.state.activeCensoring) {
			dbgLog('evt: found available observer, starting!');
			currentContext.observer.forceStart(document.body);
		}
		if ((currentContext?.preferences.subliminal?.enabled ?? false) && (currentContext?.state.activeCensoring || currentContext?.preferences.subliminal?.ignoreCensorState)) {
			//this should really be happening as a runtime message from the background script
			// just inject it from there on page load, but that needs a refactor first.
			// that actually requires a lot of info on the background side.
			// this method ties it to the page censoring process, for better *and* worse
      dbg('sending message for subliminals');
			browser.runtime.sendMessage({msg: MSG_INJECT_SUBLIMINAL.event});
		}
		if (!currentContext) {
			console.debug('Beta Protection - Page loaded, but censoring not complete. Ignoring loaded event!')
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
