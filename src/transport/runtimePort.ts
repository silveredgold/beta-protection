import { dbgLog } from '@/util';
import browser from 'webextension-polyfill';

export class RuntimePortManager {
    private ports: Map<string, {src: string, port: browser.Runtime.Port}> = new Map();

    /**
     *
     */
    constructor() {
        
        
    }

    addNamedPort = (port: browser.Runtime.Port, sender: string) => {
        this.ports.set(port.name, {src: sender, port});

    } 

    sendMessage = (msg: object, id: string, src?: string) => {
        if (id && this.ports.has(id)) {
            const port = this.ports.get(id);
            dbgLog('dedicated port transport found, sending message', port, msg);
            try {
                port?.port.postMessage(msg);
            } catch (e) {
                if ((e as Error).message.includes('disconnected')) {
                    console.warn('Failed to send message on disconnected port. The request has likely been cancelled.');
                } else {
                    throw e;
                }
            }

        } else if (src) {
            dbgLog('no dedicated port found, falling back to tabs', src, msg);
            browser.tabs.sendMessage(parseInt(src), msg);
        } else {
            dbgLog('no dedicated port found, falling back to runtime', msg);
            browser.runtime.sendMessage(msg);
        }
    }

    closeForSrc = (src: string) => {
        const allPorts = [...this.ports.values()].filter(p => p.src == src);
        const portNames = allPorts.map(p => p.port.name);
        if (allPorts.length > 0) {
            console.log('closing all ports for source', src, allPorts);
            for (const port of allPorts) {
                port.port.disconnect();
            }
        }
        return portNames;
    }
}