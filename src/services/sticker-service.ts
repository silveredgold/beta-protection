export class StickerService {
    public static loadAvailableStickers = async (message: any) => {
        const stickerCategories = message['stickers'] as string[];
        await chrome.storage.local.set({'stickers': stickerCategories});
    }

    public static getAvailable = async (): Promise<string[]> => {
        const resp = await chrome.storage.local.get('stickers');
        return resp['stickers']
    }
}