/**
 * Folder Suggest
 * 
 * Autocomplete component for folder selection in settings.
 */

import { AbstractInputSuggest, App, TFolder } from 'obsidian';

/**
 * Folder autocomplete suggestion for text inputs
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    private textInputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.textInputEl = inputEl;
    }

    getSuggestions(inputStr: string): TFolder[] {
        const folders: TFolder[] = [];
        const lowerInput = inputStr.toLowerCase();

        // Get all folders in the vault
        this.app.vault.getAllLoadedFiles().forEach(file => {
            if (file instanceof TFolder) {
                if (file.path.toLowerCase().includes(lowerInput)) {
                    folders.push(file);
                }
            }
        });

        // Sort by path length (shorter = more relevant)
        return folders.sort((a, b) => a.path.length - b.path.length).slice(0, 20);
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.createDiv({ text: folder.path });
    }

    selectSuggestion(folder: TFolder): void {
        this.textInputEl.value = folder.path;
        this.textInputEl.trigger('input');
        this.close();
    }
}

