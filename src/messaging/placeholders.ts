import { MessageContext } from "@/events";
import { LocalPlaceholder } from "@/placeholders";
import { getAvailablePlaceholders, getEnabledPlaceholders } from "@/preferences";
import { RuntimeEvent } from ".";
import browser from 'webextension-polyfill';


export const MSG_PLACEHOLDERS_AVAILABLE : RuntimeEvent<{categories: string[], allImages: LocalPlaceholder[]}> = {
    event: 'getAvailablePlaceholders',
    handler: async (msg, sender, ctx) => {
        const res = await getAvailablePlaceholders();
        return res;
    }
};

export const MSG_PLACEHOLDERS_ENABLED: RuntimeEvent<{categories: string[], allImages: LocalPlaceholder[]}> = {
    event: 'getEnabledPlaceholders',
    handler: async (msg, sender, ctx) => {
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
};

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