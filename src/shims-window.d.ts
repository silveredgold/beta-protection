import { ConnectorApi } from "./connector/types";
declare global {
    interface Window { BetaProtection?: ConnectorApi; }
}