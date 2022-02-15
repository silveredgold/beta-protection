import { MessageContext } from "@/events";
import { base64ArrayBuffer } from "@/util";
import { Emitter } from "mitt";
import { InjectionKey } from "vue";
import browser from 'webextension-polyfill';

export const MSG_STATUS: RuntimeEvent<{queue: number, state: boolean}> = {
    event: 'getSocketStatus',
    handler: async (msg, sender, ctx) => {
        return {queue: 0, state: !!ctx.socketClient};
    }
}

export const MSG_RESET_STATISTICS: RuntimeEvent<void> = {
    event: "resetStatistics",
    handler: async (msg, sender, ctx) => {
        ctx.socketClient!.send(JSON.stringify({
            version: ctx.version,
            msg: "resetStatistics"
        }));
    }
}

export const MSG_GET_STATISTICS: RuntimeEvent<void> = {
    event: "getStatistics",
    handler: async (msg, sender, ctx) => {
        ctx.socketClient.send(JSON.stringify({
            version: ctx.version,
            msg: "getStatistics"
        }));
    }
}


export const MSG_IMAGE_DATA : RuntimeEvent<string> = {
    event: 'getImageData',
    handler: async (msg, sender, ctx) => {
        console.log('fetching path', msg.path);
        const resp = await fetch(msg.path, {credentials: 'include'});
        const type = resp.headers.get('content-type')
        debugger;
        console.log('getting buffer from bg response', resp.status, type);
        const buffer = await resp.arrayBuffer();
        return base64ArrayBuffer(buffer, type);
        // return dataBuffer.toString('base64')
    }
}




export type RuntimeEvent<Type> = {
    event: string;
    handler: (message: any, sender: browser.Runtime.MessageSender, ctx: MessageContext) => Promise<Type> 
}

export const eventEmitter: InjectionKey<Emitter<ActionEvents>> = Symbol();



export type ActionEvents = {
    reload: string;
}