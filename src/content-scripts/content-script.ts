import { getAvailablePlaceholders } from "@/preferences";
import { IPreferences, OperationMode } from "@/preferences/types";
import { PlaceholderService } from "@/services/placeholder-service";
import { WebSocketClient } from "@/transport/webSocketClient";
import { Purifier } from "./purifier";
import { runSubliminal } from "./subliminal";
import { CensoringState, CensoringContext } from "./types";
import { configureVideo, configureVideoPrefs, hashCode, isSafe } from "./util";

// console.log('Hello from the content-script');


// let plSvc = new PlaceholderService(socketClient);
// let placeholderSelections = plSvc.getLoaded();
let instanceConfigured: boolean = false;
let lastClickElement: HTMLElement|undefined|null;
let safeList: number[] = [];
let windowLocation = window.location.href;

// getState => prepareDOM => prepareEvents => page setup

async function getClient() {
	return await WebSocketClient.create();
}

const loadPlaceholders = async (): Promise<void> => {
	
}

const getCensoringState = async (): Promise<CensoringState> => {
	let confPrefs = await chrome.storage.local.get('preferences');
	let website = window.location.href.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
	if (confPrefs) {
		let prefs = confPrefs["preferences"] as IPreferences;
		let mode = prefs.mode;
		console.log(`content script found preferences: ${prefs.mode}`)
		let whitelist = prefs.allowList;
		let blacklist = prefs.forceList;
		let siteAllowed = whitelist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => wle == website);
		if (siteAllowed || mode == OperationMode.Disabled) {
			return {activeCensoring: true}
		} else if (mode == OperationMode.OnDemand) {
			let siteForced = blacklist.map(l => l.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase()).some(wle => wle == website);
			return {activeCensoring: siteForced};
		} else {
			return {activeCensoring: false};
		}
	} else {
		return {activeCensoring: false};
	}
}

const injectStyles = async (context: CensoringContext): Promise<CensoringContext> => {
	if (!context.preferences) {
		let confPrefs = await chrome.storage.local.get('preferences');
		context.preferences = confPrefs['preferences']
	}
	let headEl = document.getElementsByTagName('head')[0];
	if(context.state.activeCensoring){
		console.log("Beta Safety - Filtering active.");
		headEl.append('<style class="safetyCSS">' +
			'img { visibility: hidden !important; }' +
			'img:not(.purified) { visibility: hidden !important; }' +
			'img.purified { visibility: visible !important; }' +
			'img.purifying { max-width: 100%; object-fit: contain !important; }'+
			':not(.purifiedBG) { background-size: 0 !important; }' +
			'video:not(.purified) {	visibility: hidden !important; }'+
			'video.purified{ min-height: 250px; max-height: 100% !important; max-width: 100% !important; }'+
			':not(.purifiedBG) { background-size: 0 !important; } </style>');
		await configureVideoPrefs(context.preferences!, headEl);
	} else {
		console.log("Beta Safety - On Demand / Whitelist.");
		headEl.append('<style class="safetyCSS">' +
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
		);
	}    
	return context;
}

const prepareEvents = async (context: CensoringContext, runImmediately: boolean = false): Promise<void> => {
	let placeholders = await getAvailablePlaceholders();
	context.preferences!.enabledPlaceholders = placeholders.categories;
	let purifier = new Purifier(context.state, context.preferences!.videoCensorMode, window.location, placeholders.allImages);
	let observer = trackDOM(purifier);
	// Observe for mutations after page load has completed.
	if (runImmediately) {
	if(document.readyState !== 'loading'){
		pageSetup(observer, purifier, context);
	} else {
		window.addEventListener('DOMContentLoaded', (event) => {
			pageSetup(observer, purifier, context);
		});
	}
}
}

const trackDOM = (purifier: Purifier) => {
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
					console.log(`mutation running, checking for safe! ${safe}`);
					if(safe){
						// Do nothing since it's safe.
					} else {
						target.classList.remove("purified");
						target.classList.remove("purifiedBG");
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
			purifier.ready = false;
			// activeCensoring = true;
			if (document.getElementsByClassName("safetyCSS").length > 0) {
				Array.prototype.forEach.call(document.getElementsByClassName("safetyCSS"), function (el) {
					el.remove();
				});
			}
			runCensoring(false);
		}
		if (purifier.backlog && purifier.ready) {
			purifier.backlog = false;
			purifier.start()
		}
	}, 200);

	if (context.preferences!.subliminal.enabled) {
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
			sendResponse({value: lastClickElement.classList.value, src: lastClickElement["src"]});
		}
		// Results for censor requests here. Set the image in the appropriate element.
		if(request.msg === "setSrc" && request.type === "normal") {
			console.log(`got normal setSrc message! ${request.id}`)
			let elements = document.getElementsByClassName(request.id);
			let requestElement = elements.length > 0 ? elements[0] : undefined;
			if(requestElement !== undefined){
				requestElement.setAttribute('src', request.censorURL);
				requestElement.classList.remove("purifying");
				safeList.push(hashCode(request.censorURL));
			}
		} else if(request.msg === "setSrc" && request.type === "BG") {
			console.log(`got background setSrc message! ${request.id}`)
			let elements = document.getElementsByClassName(request.id);
			let requestElement = elements.length > 0 ? elements[0] : undefined;
			if(requestElement !== undefined) {
				(requestElement as HTMLElement).style.backgroundImage = "url('" + request.censorURL + "')";
				safeList.push(hashCode(request.censorURL));
			}
		}
	});
}


function runCensoring(firstRun: boolean) {
	getCensoringState().then(state => {
		let ctx: CensoringContext = {
			state: state
		};
		injectStyles(ctx).then(ctx => {
			if (firstRun) {
				prepareEvents(ctx, true);
			}
		});
	});
}



loadPlaceholders().then(() => {
	configureListeners();
	runCensoring(true);
});