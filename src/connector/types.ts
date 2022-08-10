export type ConnectorApi = {
    getCurrentVersion?: ()=> Promise<string>;
    isEnabledOnPage?: ()=> Promise<boolean>;
    isOverrideActive?: ()=>Promise<string>;
}