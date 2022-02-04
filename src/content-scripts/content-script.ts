import { PlaceholderService } from "@/services/placeholder-service";
import { WebSocketClient } from "@/transport/webSocketClient";

console.log('Hello from the content-script');

let socketClient: WebSocketClient = new WebSocketClient();

var plSvc = new PlaceholderService(socketClient);
let placeholderSelections = await plSvc.getLoaded();