/**
 * Confirm Modal
 * 
 * Reusable Obsidian-native confirmation dialog that replaces
 * native browser `confirm()` calls. Returns a Promise<boolean>
 * so callers can await the user's decision.
 * 
 * Usage:
 * ```typescript
 * const confirmed = await ConfirmModal.show(this.app, {
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     confirmText: 'Delete',
 *     danger: true,
 * });
 * if (confirmed) { ... }
 * ```
 */

import { App, Modal, Setting } from 'obsidian';

export interface ConfirmModalOptions {
    /** Title displayed at the top of the modal */
    title: string;
    /** Body message explaining what the user is confirming */
    message: string;
    /** Text for the confirm button (default: 'Confirm') */
    confirmText?: string;
    /** Text for the cancel button (default: 'Cancel') */
    cancelText?: string;
    /** If true, the confirm button uses warning styling */
    danger?: boolean;
}

/**
 * Obsidian-native confirmation modal
 */
export class ConfirmModal extends Modal {
    private options: ConfirmModalOptions;
    private resolve: (value: boolean) => void = () => { };

    constructor(app: App, options: ConfirmModalOptions) {
        super(app);
        this.options = options;
    }

    /**
     * Show a confirmation dialog and return the user's choice.
     * 
     * @param app - The Obsidian App instance
     * @param options - Configuration for the dialog
     * @returns true if the user confirmed, false if they cancelled or closed the modal
     */
    static show(app: App, options: ConfirmModalOptions): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmModal(app, options);
            modal.resolve = resolve;
            modal.open();
        });
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-confirm-modal');

        // Title
        contentEl.createEl('h3', { text: this.options.title });

        // Message
        contentEl.createEl('p', {
            text: this.options.message,
            cls: 'qb-confirm-message'
        });

        // Buttons
        const buttonContainer = new Setting(contentEl);

        buttonContainer.addButton(btn => btn
            .setButtonText(this.options.cancelText || 'Cancel')
            .onClick(() => {
                this.resolve(false);
                this.close();
            }));

        buttonContainer.addButton(btn => {
            btn.setButtonText(this.options.confirmText || 'Confirm')
                .setCta();

            if (this.options.danger) {
                btn.setWarning();
            }

            btn.onClick(() => {
                this.resolve(true);
                this.close();
            });
        });
    }

    onClose(): void {
        // If the modal is closed without clicking a button (e.g., Escape key),
        // resolve as false (user did not confirm)
        this.resolve(false);
        this.contentEl.empty();
    }
}
