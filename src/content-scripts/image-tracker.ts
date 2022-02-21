
type CensoredImage = {
    src: string;
    result?: string;
}

export class ImageTracker {
    /**
     *
     */
    constructor() {
        
        
    }

    private censoredImages = new Map<string, CensoredImage>();

    trackImage = (id: string, url: string) => {
        this.censoredImages.set(id, {src: url});
    }

    getCensored = (img: {id?: string, src?: string}) => {
        if (img.id) {
            this.censoredImages.has(img.id) ? this.censoredImages.get(img.id)?.result : undefined;
        } else {
            for (const [key, value] of this.censoredImages) {
                if (value.src == img.src && value.result) {
                    return value.result;
                }
            }
        }
    }

    updateImage = (id: string, result: string) => {
        if (this.censoredImages.has(id)) {
            const current = this.censoredImages.get(id);
            current!.result = result;
            this.censoredImages.set(id, current!);
        }
    }
}