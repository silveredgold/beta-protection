import { LocalPlaceholder } from "@/placeholders";
import { DBSchema, IDBPDatabase, openDB } from "idb"


export class DbClient {
    _db: IDBPDatabase<AssetsStore>;
    
    static create = async (): Promise<DbClient> => {
        const db = await openDB<AssetsStore>('bp-assets', 1, {
            upgrade: (db, oldVersion, newVersion, tx) => {
                const store = db.createObjectStore('placeholders', {
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

    removePlaceholder = async (placeholder: LocalPlaceholder) => {
        await this._db.delete('placeholders', placeholder.id!);
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
}

interface AssetsStore extends DBSchema {
    'placeholders': {
        value: LocalPlaceholder
        key: number;
        indexes: {'category': string}
    }
}