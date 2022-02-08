export type LocalPlaceholder = {
    id?: number;
    category: string;
    filePath: string;
    name: string;
    type: string;
    data?: Blob;
    dataUrl?: string;
    // payload?: string;
    handle?: FileSystemFileHandle;
};
