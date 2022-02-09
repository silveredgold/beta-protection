import { MessageContext } from "@/events";
import { LocalPlaceholder } from "@/placeholders";
import { getAvailablePlaceholders, getEnabledPlaceholders } from "@/preferences";
import { RuntimeEvent } from ".";


const MSG_PLH_AVAILABLE = 'getAvailablePlaceholders';
const MSG_PLH_ENABLED = 'getEnabledPlaceholders';

export const MSG_PLACEHOLDERS_AVAILABLE : RuntimeEvent<{categories: string[], allImages: LocalPlaceholder[]}> = {
    event: MSG_PLH_AVAILABLE,
    handler: processAvailableMessage
};

export const MSG_PLACEHOLDERS_ENABLED: RuntimeEvent<{categories: string[], allImages: LocalPlaceholder[]}> = {
    event: MSG_PLH_ENABLED,
    handler: processEnabledMessage
};

// export type RuntimeEvent = {
//     event: string;
//     handler: (message: any, sender: chrome.runtime.MessageSender, sendResponse: (resp: any) => void, ctx: MessageContext) => Promise<any> 
// }


export async function processAvailableMessage(message: any, sender: chrome.runtime.MessageSender, ctx: MessageContext) : Promise<{categories: string[], allImages: LocalPlaceholder[]}> {
    if (message['msg'] == MSG_PLH_AVAILABLE) {
        const res = await getAvailablePlaceholders();
        return res;
    }
    throw new Error("Unrecognized message!");
}

export async function processEnabledMessage(message: any, sender: chrome.runtime.MessageSender, ctx: MessageContext) : Promise<{categories: string[], allImages: LocalPlaceholder[]}> {
    if (message['msg'] == MSG_PLH_ENABLED) {
        const res = await getEnabledPlaceholders();
        for (const placeholder of res.allImages) {
            if (placeholder.data) {
                const fileUrl = await readFileUrlAsync(placeholder.data);
                if (fileUrl && typeof fileUrl === "string") {
                    placeholder.dataUrl = fileUrl;
                }
                
            }
        }
        return res;
    }
    throw new Error("Unrecognized message!");
}


function readFileUrlAsync(file: Blob): Promise<string|ArrayBuffer|null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        resolve(reader.result);
      };
  
      reader.onerror = reject;
  
      reader.readAsDataURL(file);
    });
}