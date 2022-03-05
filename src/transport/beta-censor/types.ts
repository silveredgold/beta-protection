export type censorImageResponse = {
    requestId?: string
    imageResult: ImageResult,
    censoredImage: CensoredImage,
    error: string
}

export type CensoredImage = {
    imageDataUrl: string,
    mimeType: string,
    imageContents: ArrayBuffer
}

export type ImageResult = {
    [x: string|symbol|number]: unknown;
}

export type censorImageRequest = {
    RequestId?: string;
    ImageUrl?: string;
    ImageDataUrl?: string|null;
    CensorOptions?: {[key: string]: {CensorType: string, Level: number}};
}