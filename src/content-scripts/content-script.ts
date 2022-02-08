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

// console.log('Hello from the content-script');


// let plSvc = new PlaceholderService(socketClient);
// let placeholderSelections = plSvc.getLoaded();
let instanceConfigured: boolean = false;
let lastClickElement: HTMLElement|undefined|null;
let safeList: number[] = [];
// let windowLocation = window.location.href;

// getState => prepareDOM => prepareEvents => page setup

const loadPlaceholders = async (): Promise<void> => {
	
}

const getCensoringState = async (): Promise<CensoringState> => {
	// let confPrefs = await chrome.storage.local.get('preferences');
	let prefs = await loadPreferencesFromStorage();
	let website = window.location.href.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
	if (prefs?.mode) {
		// let prefs = confPrefs["preferences"] as IPreferences;
		let mode = prefs.mode;
		console.log(`content script found preferences: ${prefs.mode}`)
		let whitelist = prefs.allowList?.length ? prefs.allowList : [];
		let blacklist = prefs.forceList?.length ? prefs.forceList : [];
		console.log(`domain matching`, whitelist, blacklist, website);
		// console.log(`blacklist:`, blacklist);
		let siteAllowed = whitelist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => website.includes(wle));
		if (siteAllowed || mode == OperationMode.Disabled) {
			console.log(`running in disabled mode`);
			return {activeCensoring: false}
		} else if (mode == OperationMode.OnDemand) {
			let siteForced = blacklist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => website.includes(wle));
			console.log(`running in on demand: ${siteForced}`);
			return {activeCensoring: siteForced};
		} else {
			return {activeCensoring: true};
		}
	} else {
		return {activeCensoring: false};
	}
}

const buildContext = async (state: CensoringState): Promise<CensoringContext> => {
	let confPrefs = await chrome.storage.local.get('preferences');
	let preferences = confPrefs['preferences'] as IPreferences;
	// let tab = await chrome.tabs.getCurrent();
	// let placeholders = await getAvailablePlaceholders();
	let newProm = new Promise(resolve => {
		chrome.runtime.sendMessage({msg: MSG_PLACEHOLDERS_ENABLED.event}, resp => resolve(resp));
	})
	let placeholders: any = await newProm;
	console.debug('got placeholder response maybe?', placeholders)
	//TODO; not how that works
	preferences!.enabledPlaceholders = placeholders.categories;
	let purifier = new Purifier(state, preferences!.videoCensorMode, window.location, placeholders.allImages);
	let context: CensoringContext = {
		state,
		preferences,
		purifier
	};
	console.log('built context', context);
	return context;
}

const injectStyles = async (context: CensoringContext): Promise<CensoringContext> => {
	console.log(`state: ${context.state.activeCensoring}`);
	if(context.state.activeCensoring){
		console.log("Beta Protection - Censoring Enabled!");
		chrome.runtime.sendMessage({msg: 'injectCSS', preferences: context.preferences});
	} else {
		console.log("Beta Protection - Not censoring current page.");
	}    
	return context;
}

const prepareEvents = async (context: CensoringContext, runImmediately: boolean = false): Promise<void> => {

	let observer = buildObserver(context.purifier);
	// Observe for mutations after page load has completed.
	if (runImmediately && observer !== undefined) {
		if (document.readyState !== 'loading') {
			pageSetup(observer, context.purifier, context);
		} else {
			window.addEventListener('DOMContentLoaded', (event) => {
				pageSetup(observer!, context.purifier, context);
			});
		}
	}
}

const buildObserver = (purifier: Purifier) => {
	const observer = PageObserver.create(purifier, safeList);
	return observer;
}

function pageSetup(observer: PageObserver, purifier: Purifier, context: CensoringContext) {

	if (context.preferences!.subliminal?.enabled ?? false) {
		runSubliminal(context.preferences!.subliminal);
	}
	// what if I didn't run this until the background script sent its event?
	// I guess images would be visible while loading?
	// do a run on loading, then start the observer on completed?
	//prepareEvents is the one that watches for the DOM status
	purifier.run();
	observer.start(document.body);
}

// Activate censoring on this page.
const configureListeners = () => {

	document.addEventListener("contextmenu", function(event){
		lastClickElement = event.target as HTMLElement;
	}, true);

	// Receive message from the background script here.
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		console.log(`content-script onMessage listener!`);
		if(request.msg === "getClickedEl" && lastClickElement) {
			lastClickElement.classList.add("redoRequest");
			let origSrc = lastClickElement.getAttribute('censor-src');
			let respValue = {src: lastClickElement.getAttribute("src"), id: lastClickElement.getAttribute('censor-id'), origSrc};
			console.log('sending getClickedEl response', respValue)
			sendResponse(respValue);
		}
		// Results for censor requests here. Set the image in the appropriate element.
		if(request.msg === "setSrc" && request.type === "normal") {
			console.log(`got normal setSrc message! ${request.id}`)
			let requestElement = document.querySelector(`[censor-id="${request.id}"]`)
			if(requestElement){
				console.log(`finalizing purify for ${requestElement}`)
				requestElement.setAttribute('src', request.censorURL);
				requestElement.setAttribute('censor-state', 'censored');
				requestElement.classList.remove("purifying");
				safeList.push(hashCode(request.censorURL));
			}
		} else if(request.msg === "setSrc" && request.type === "BG") {
			console.log(`got background setSrc message! ${request.id}`)
			let requestElement = document.querySelector(`[censor-id="${request.id}"]'`)
			if(requestElement) {
				(requestElement as HTMLElement).style.backgroundImage = "url('" + request.censorURL + "')";
				console.log(`finalizing BG purify for ${requestElement}`)
				requestElement.setAttribute('censor-style', 'censored');
				//TODO: should this remove the CSS classes?
				safeList.push(hashCode(request.censorURL));
			}
		}
	});

	chrome.runtime.onMessage.addListener((req, sender) => {
		if (req.msg === 'pageChanged') {
			console.log('notified of page change, re-running!');
			runCensoring(false);
		}
	})
}


function runCensoring(firstRun: boolean) {
	//holy shit I hate synchronous JS
	getCensoringState().then(state => {
		buildContext(state).then(ctx => {
			injectStyles(ctx).then(ctx => {
				if (firstRun) {
					prepareEvents(ctx, true);
				}
			});
		});
	});
}

async function runCensoringAsync(firstRun: boolean) {
	let state = await getCensoringState();
	let ctx = await buildContext(state);
	ctx = await injectStyles(ctx);
	if (firstRun) {
		await prepareEvents(ctx, true);
	}
}

const testStorage = async () => {
	await chrome.storage.local.set({'testArray': ['0', '1', '2']});
	let result = await chrome.storage.local.get({'testArray': []});
	console.log('storage test result', result);

}

// getLocalPlaceholder();

// testStorage();

loadPlaceholders().then(() => {
	configureListeners();
	runCensoring(true);
});