import browser from 'webextension-polyfill';

export class StickerService {
    public static loadAvailableStickers = async (message: any) => {
        const stickerCategories = message['stickers'] as string[];
        await browser.storage.local.set({'stickers': stickerCategories});
    }

    public static getAvailable = async (): Promise<string[]> => {
        const resp = await browser.storage.local.get('stickers');
        return resp['stickers']
    }
}