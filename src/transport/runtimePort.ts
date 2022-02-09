export class RuntimePortManager {
    private ports: Map<string, {src: string, port: chrome.runtime.Port}> = new Map();

    /**
     *
     */
    constructor() {
        
        
    }

    addNamedPort = (port: chrome.runtime.Port, sender: string) => {
        this.ports.set(port.name, {src: sender, port});

    } 

    sendMessage = (msg: object, id: string, src: string) => {
        if (this.ports.has(id)) {
            let port = this.ports.get(id);
            console.log('dedicated port transport found, sending message', port, msg)
            port?.port.postMessage(msg);

        } else if (src) {
            console.log('no dedicated port found, falling back to tabs', src, msg);
            chrome.tabs.sendMessage(parseInt(src), msg);
        } else {
            console.log('no dedicated port found, falling back to runtime', msg);
            chrome.runtime.sendMessage(msg);
        }
    }

    closeForSrc = (src: string) => {
        let allPorts = [...this.ports.values()].filter(p => p.src == src);
        if (allPorts.length > 0) {
            console.log('closing all ports for source', src, allPorts);
            for (const port of allPorts) {
                port.port.disconnect();
            }
        }
    }
}