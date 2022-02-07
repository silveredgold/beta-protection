import { getAvailablePlaceholders, getEnabledPlaceholders, loadPreferencesFromStorage } from "@/preferences";
import { IPreferences, OperationMode } from "@/preferences/types";
import { PlaceholderService } from "@/services/placeholder-service";
import { WebSocketClient } from "@/transport/webSocketClient";
import { CSSManager } from "./cssManager";
import { Purifier } from "./purifier";
import { runSubliminal } from "./subliminal";
import { CensoringState, CensoringContext } from "./types";
import { hashCode, isSafe, readDirectories } from "./util";

// console.log('Hello from the content-script');


// let plSvc = new PlaceholderService(socketClient);
// let placeholderSelections = plSvc.getLoaded();
let instanceConfigured: boolean = false;
let lastClickElement: HTMLElement|undefined|null;
let safeList: number[] = [];
let windowLocation = window.location.href;

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
		console.log(`whitelist`, whitelist);
		console.log(`blacklist:`, blacklist);
		let siteAllowed = whitelist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => wle == website);
		if (siteAllowed || mode == OperationMode.Disabled) {
			console.log(`running in disabled mode`);
			return {activeCensoring: false}
		} else if (mode == OperationMode.OnDemand) {
			let siteForced = blacklist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => wle == website);
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
	let placeholders = await getEnabledPlaceholders(preferences);
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

const getLocalPlaceholder = async () => {
	let dirent = await getDirectory();
	let subDirPaths = await readDirectories(dirent);
	console.log('read subdirs', subDirPaths);
}

const getDirectory = () => {
	return new Promise<FileSystemDirectoryEntry>(resolve => {
		chrome.runtime.getPackageDirectoryEntry(dirent => resolve(dirent));
	});
}

const injectStyles = async (context: CensoringContext): Promise<CensoringContext> => {
	console.log(`state: ${context.state.activeCensoring}`);
	if(context.state.activeCensoring){
		console.log("Beta Protection - Censoring Enabled!");

		chrome.runtime.sendMessage({msg: 'injectCSS', preferences: context.preferences});

		// I don't know what this was supposed to be doing tbh
		// headEl.append('<style class="safetyCSS">' +
		// 	'img { visibility: hidden !important; }' +
		// 	'img:not(.purified) { visibility: hidden !important; }' +
		// 	'img.purified { visibility: visible !important; }' +
		// 	'img.purifying { max-width: 100%; object-fit: contain !important; }'+
		// 	':not(.purifiedBG) { background-size: 0 !important; }' +
		// 	'video:not(.purified) {	visibility: hidden !important; }'+
		// 	'video.purified{ min-height: 250px; max-height: 100% !important; max-width: 100% !important; }'+
		// 	':not(.purifiedBG) { background-size: 0 !important; } </style>');
	} else {
		console.log("Beta Protection - Not censoring current page.");
		/*headEl.append('<style class="safetyCSS">' +
			'video {\n' +
			'filter: blur(0px) !important;\n' +
			'}\n' +
			'img:not(.purified) {\n' +
			'    visibility: visible !important;\n' +
			'}\n' +
			'\n' +
			'video:not(.purified) {\n' +
			'    visibility: visible !important;\n' +
			'}\n</style>'
		); */
	}    
	return context;
}

const prepareEvents = async (context: CensoringContext, runImmediately: boolean = false): Promise<void> => {
	
	let observer = buildObserver(context.purifier);
	// Observe for mutations after page load has completed.
	if (runImmediately) {
	if(document.readyState !== 'loading'){
		pageSetup(observer, context.purifier, context);
	} else {
		window.addEventListener('DOMContentLoaded', (event) => {
			pageSetup(observer, context.purifier, context);
		});
	}
}
}

const buildObserver = (purifier: Purifier) => {
	let observer;
	if (window.MutationObserver) {
		//yay, setup callback for mutations
		observer = new MutationObserver((mutations) => {
			purifier.start()

			// Loop that checks for images being replaced after they've been purified, to ensure they are
			// processed again if needed.
			mutations.forEach(mutation => {
				if (mutation.type === "attributes" && mutation.attributeName === "src") {
					let target = mutation.target as Element;
					let safe = isSafe(mutation.target["src"], safeList);
					console.log(`mutation running, checking for safe! ${safe}`, mutation.target["src"]);
					if(safe){
						// Do nothing since it's safe.
					} else {
						target.setAttribute('censor-state', 'unsafe')
						// target.classList.remove("purified");
						// target.classList.remove("purifiedBG");
						purifier.backlog = true;
					}
				}
			});
		});
	}
	return observer;
}

function pageSetup(observer: MutationObserver, purifier: Purifier, context: CensoringContext) {
	setInterval(function () {
		if (windowLocation !== window.location.href) {
			windowLocation = window.location.href;
			// purifier.ready = false;
			// activeCensoring = true;
			runCensoring(false);
		}
		if (purifier.backlog && purifier.ready) {
			purifier.backlog = false;
			purifier.start()
		}
	}, 200);

	if (context.preferences!.subliminal?.enabled ?? false) {
		runSubliminal(context.preferences!.subliminal);
	}

	purifier.start();
	observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeOldValue : true});

	setTimeout(function () {
		purifier.backlog = true;
	}, 2000);
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
			let respValue = {src: lastClickElement["src"], id: lastClickElement.getAttribute('censor-id')};
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

testStorage();

loadPlaceholders().then(() => {
	configureListeners();
	runCensoring(true);
});