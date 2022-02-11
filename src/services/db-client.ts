import { LocalPlaceholder } from "@/placeholders";
import { DBSchema, IDBPDatabase, openDB } from "idb"
import { SubliminalMessage } from "./subliminal-service";


export class DbClient {
    _db: IDBPDatabase<AssetsStore>;
    
    static create = async (): Promise<DbClient> => {
        const db = await openDB<AssetsStore>('bp-assets', 1, {
            upgrade: (db, oldVersion, newVersion, tx) => {
                const store = db.createObjectStore('placeholders', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                const subStore = db.createObjectStore('subMessages', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('category', 'category', {unique: false, multiEntry: false});
            }
        });
        return new DbClient(db);
    }

    /**
     *
     */
    private constructor(db: IDBPDatabase<AssetsStore>) {
        this._db = db;
        
    }

    addPlaceholder = async (placeholder: LocalPlaceholder) => {
        const res = await this._db.put('placeholders', placeholder);
        return res;
    }

    addPlaceholders = async (placeholders: LocalPlaceholder[]) => {
        const tx = this._db.transaction('placeholders', 'readwrite');
        const txProms = placeholders.map(pl => {
            tx.store.add(pl)
        });
        await Promise.all([
            ...txProms,
            tx.done,
        ]);
    }

    addMessages = async (msgs: SubliminalMessage[]) => {
        const tx = this._db.transaction('subMessages', 'readwrite');
        const txProms = msgs.map(pl => {
            tx.store.add(pl)
        });
        await Promise.all([
            ...txProms,
            tx.done,
        ]);
    }

    purgeMessages = async () => {
        // const tx = this._db.transaction('subMessages', 'readwrite');
        const msgs = await this._db.getAll('subMessages');
        for (const msg of msgs) {
            await this._db.delete('subMessages', msg.id!);
        }
        // const txProms = msgs.map(pl => {
        //     tx.store.delete(pl.id!);
        // });
        // await Promise.all([
        //     ...txProms,
        //     tx.done
        // ]);
    }

    removePlaceholder = async (id: number) => {
        await this._db.delete('placeholders', id);
    }

    removePlaceholders = async (ids: number[]) => {
        const tx = this._db.transaction('placeholders', 'readwrite');
        const txProms = ids.map(pl => {
            tx.store.delete(pl);
        });
        await Promise.all([
            ...txProms,
            tx.done
        ]);
    }

    getLocalPlaceholders = async (category?: string) => {
        if (category) {
            const results = await this._db.getAllFromIndex('placeholders', 'category', category);
            return results;
        } else {
            const results = await this._db.getAll('placeholders');
            return results;
        }
    }

    getSubliminalMessages = async () => {
        const results = await this._db.getAll('subMessages');
        return results;
    }
}

interface AssetsStore extends DBSchema {
    'placeholders': {
        value: LocalPlaceholder
        key: number;
        indexes: {'category': string}
    },
    'subMessages': {
        value: SubliminalMessage,
        key: number
    }
}