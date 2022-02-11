import { MessageContext } from "@/events";
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

export class Deferred {
    promise: Promise<any>;
    reject?: (reason?: any) => void;
    resolve?: (value: unknown) => void;
    constructor() {
      this.promise = new Promise<any>((resolve, reject)=> {
        this.reject = reject
        this.resolve = resolve
      })
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