/**
 * Smart Template Modal
 * 
 * Entry point for the Scrivener's Desk template system.
 * Routes to ScrollLibraryModal as the primary template gallery.
 * 
 * Note: DynamicTemplateModal and TemplatePickerModal were deprecated in Session 3
 * of the Template System Overhaul. Quest creation from templates now happens
 * directly via ScrivenersQuillModal's "Create File" button.
 */

import { App } from 'obsidian';
import type QuestBoardPlugin from '../../main';

/**
 * Main entry point - opens The Scroll Library
 */
export async function openSmartTemplateModal(app: App, plugin: QuestBoardPlugin): Promise<void> {
    const { openScrollLibraryModal } = await import('./ScrollLibraryModal');
    openScrollLibraryModal(app, plugin);
}
