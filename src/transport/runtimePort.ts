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
        if (this.ports.has(id)) {
            const port = this.ports.get(id);
            console.log('dedicated port transport found, sending message', port, msg)
            port?.port.postMessage(msg);

        } else if (src) {
            console.log('no dedicated port found, falling back to tabs', src, msg);
            browser.tabs.sendMessage(parseInt(src), msg);
        } else {
            console.log('no dedicated port found, falling back to runtime', msg);
            browser.runtime.sendMessage(msg);
        }
    }

    closeForSrc = (src: string) => {
        const allPorts = [...this.ports.values()].filter(p => p.src == src);
        if (allPorts.length > 0) {
            console.log('closing all ports for source', src, allPorts);
            for (const port of allPorts) {
                port.port.disconnect();
            }
        }
    }
}