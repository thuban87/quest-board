/**
 * File Suggest
 * 
 * Autocomplete component for file selection in modals/settings.
 */

import { AbstractInputSuggest, App, TFile } from 'obsidian';

/**
 * File autocomplete suggestion for text inputs
 */
export class FileSuggest extends AbstractInputSuggest<TFile> {
    private textInputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.textInputEl = inputEl;
    }

    getSuggestions(inputStr: string): TFile[] {
        const files: TFile[] = [];
        const lowerInput = inputStr.toLowerCase();

        // Get all markdown files in the vault
        this.app.vault.getAllLoadedFiles().forEach(file => {
            if (file instanceof TFile && file.extension === 'md') {
                if (file.path.toLowerCase().includes(lowerInput)) {
                    files.push(file);
                }
            }
        });

        // Sort by path length (shorter = more relevant)
        return files.sort((a, b) => a.path.length - b.path.length).slice(0, 20);
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.createDiv({ text: file.path });
    }

    selectSuggestion(file: TFile): void {
        this.textInputEl.value = file.path;
        this.textInputEl.trigger('input');
        this.close();
    }
}
