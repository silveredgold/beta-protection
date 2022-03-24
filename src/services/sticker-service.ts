import { ICensorBackend } from '@silveredgold/beta-shared/transport';
import browser from 'webextension-polyfill';

export class StickerService {
    public static loadAvailableStickers = async (message: any) => {
        const stickerCategories = message['stickers'] === undefined
            ? message as string[]
            : message['stickers'] as string[];
        await browser.storage.local.set({'stickers': stickerCategories});
    }

    public static getAvailable = async (): Promise<string[]> => {
        const resp = await browser.storage.local.get('stickers');
        return resp['stickers']
    }

    public static tryRefreshAvailable = async(backend: ICensorBackend) => {
        try {
            const stickers = await backend.getAvailableAssets('stickers');
            if (stickers !== undefined && stickers.length !== undefined) {
                await StickerService.loadAvailableStickers(stickers)
            }
        } catch {
            //ignored
        }
        const newStickers = await StickerService.getAvailable();
        return newStickers;
    }
}