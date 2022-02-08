/// <reference types="wicg-file-system-access"/>


export class FileSystemClient {

    openDir = async () => {
        const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker();
        return dirHandle;
    }

    getFile = async (types: FilePickerAcceptType[]): Promise<LoadedFileHandle> => {
        const [fileHandle] = await window.showOpenFilePicker({types});
        let file = await fileHandle.getFile();
        return {
            file,
            handle: fileHandle
        };
    }

    getFiles = async (filter?: (file: File) => boolean): Promise<{dir: string, files: LoadedFileHandle[]}> => {
        const dirHandle = await window.showDirectoryPicker();
        const promises: Promise<{handle: FileSystemFileHandle, file: File}>[] = [];
        // console.log('got dir handle', dirHandle);
        for await (const entry of dirHandle.values()) {
            if (entry.kind !== 'file') {
                break;
            }
            // console.log('building promise for file', entry);
            promises.push(entry.getFile().then((file) => {return {handle: entry, file}}));
        }
        let result = await Promise.all(promises);
        // console.log('awaited results', result);
        let results = result.filter(r => filter ? filter(r.file) : true);
        // console.log('filtered results', results);
        return {dir: dirHandle.name, files: results};
    }

    getDirectoriesandFiles = async (filter?: (file: File) => boolean): Promise<{[key: string]: LoadedFileHandle[]}> => {
        const dirHandle = await window.showDirectoryPicker();
        const getAllHandles = await this.listAllFilesAndDirs(dirHandle);
        let obj: {[key: string]: LoadedFileHandle[]} = {}
        for (const handle of getAllHandles) {
            if (handle.kind == "directory") {
                let childRefs = getAllHandles.filter(f => f.kind == "file" && f.parent.name === handle.name);
                let childHandles = childRefs.map(r => r.handle as FileSystemFileHandle);
                if (childHandles.length == 0) {
                    break;
                }
                const promises: Promise<LoadedFileHandle>[] = [];
                for await (const entry of childHandles) {
                    if (entry.kind !== 'file') {
                        break;
                    }
                    // console.log('building promise for file', entry);
                    promises.push(entry.getFile().then((file) => {return {handle: entry, file}}));
                }
                let result = await Promise.all(promises);
                obj[handle.name] = result.filter(r => filter ? filter(r.file) : true);
            }
        }
        return obj;
    }

    listAllFilesAndDirs = async (dirHandle: FileSystemDirectoryHandle) => {
        const files: {name: string, handle: FileSystemHandle, kind: "directory"|"file", parent: FileSystemDirectoryHandle}[] = [];
        for await (let [name, handle] of dirHandle) {
            const {kind} = handle;
            if (handle.kind === 'directory') {
                files.push({name, handle, kind, parent: dirHandle});
                files.push(...await this.listAllFilesAndDirs(handle));
            } else {
                files.push({name, handle, kind, parent: dirHandle});
            }
        }
        return files;
    }

    
    
    public get imageTypes() : FilePickerAcceptType[] {
        return [{description: 'Images',
        accept: {
          'image/*': ['.png', '.jpeg', '.jpg', '.jfif']
        }}];
    }
    
}

export type LoadedFileHandle = {
    handle: FileSystemFileHandle;
    file: File;
}