/**
 * Character Creation Modal
 * 
 * First-launch modal for creating a new character.
 * Also used for editing existing characters.
 */

import React, { useState, useCallback } from 'react';
import {
    CharacterClass,
    CLASS_INFO,
    CharacterAppearance,
    DEFAULT_APPEARANCE,
} from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { useUIStore } from '../store/uiStore';
import { sanitizeCharacterName } from '../utils/sanitizer';

interface CharacterCreationModalProps {
    isEdit?: boolean;
    onClose: () => void;
    onSave: () => void;
}

const SKIN_TONES: CharacterAppearance['skinTone'][] = ['light', 'medium', 'tan', 'dark'];
const HAIR_STYLES: CharacterAppearance['hairStyle'][] = ['short', 'medium', 'long', 'bald'];
const HAIR_COLORS: CharacterAppearance['hairColor'][] = ['brown', 'black', 'blonde', 'red'];
const ACCESSORIES: CharacterAppearance['accessory'][] = ['none', 'glasses', 'hat', 'headphones'];

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
    isEdit = false,
    onClose,
    onSave,
}) => {
    const { character, createCharacter, updateName, updateAppearance } = useCharacterStore();
    const closeModals = useUIStore((state) => state.closeModals);

    // Form state
    const [name, setName] = useState(character?.name || '');
    const [selectedClass, setSelectedClass] = useState<CharacterClass>(
        character?.class || 'warrior'
    );
    const [appearance, setAppearance] = useState<CharacterAppearance>(
        character?.appearance || { ...DEFAULT_APPEARANCE }
    );
    const [error, setError] = useState<string | null>(null);

    // Handle class selection
    const handleClassSelect = useCallback((classId: CharacterClass) => {
        setSelectedClass(classId);
        // Update outfit color to match class
        setAppearance((prev) => ({
            ...prev,
            outfitPrimary: CLASS_INFO[classId].primaryColor,
        }));
    }, []);

    // Handle appearance change
    const handleAppearanceChange = useCallback((
        key: keyof CharacterAppearance,
        value: string
    ) => {
        setAppearance((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        // Validate name
        const cleanName = sanitizeCharacterName(name.trim());
        if (!cleanName) {
            setError('Please enter a character name');
            return;
        }

        if (isEdit && character) {
            // Update existing character
            updateName(cleanName);
            updateAppearance(appearance);
        } else {
            // Create new character
            createCharacter(cleanName, selectedClass, appearance);
        }

        onSave();
        closeModals();
    }, [name, selectedClass, appearance, isEdit, character, createCharacter, updateName, updateAppearance, onSave, closeModals]);

    // Get class info for selected class
    const selectedClassInfo = CLASS_INFO[selectedClass];

    return (
        <div className="qb-modal-backdrop" onClick={onClose}>
            <div className="qb-modal" onClick={(e) => e.stopPropagation()}>
                <div className="qb-modal-header">
                    <h2>{isEdit ? 'Edit Character' : 'Create Character'}</h2>
                    <button className="qb-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="qb-modal-content">
                    {/* Character Name */}
                    <div className="qb-form-group">
                        <label>What is your name, adventurer?</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={50}
                            autoFocus
                        />
                        {error && <span className="qb-error">{error}</span>}
                    </div>

                    {/* Class Selection */}
                    {!isEdit && (
                        <div className="qb-form-group">
                            <label>Choose Your Class</label>
                            <div className="qb-class-list">
                                {Object.values(CLASS_INFO).map((classInfo) => (
                                    <div
                                        key={classInfo.id}
                                        className={`qb-class-option ${selectedClass === classInfo.id ? 'selected' : ''}`}
                                        onClick={() => handleClassSelect(classInfo.id)}
                                        style={{
                                            borderColor: selectedClass === classInfo.id
                                                ? classInfo.primaryColor
                                                : undefined
                                        }}
                                    >
                                        <div className="qb-class-header">
                                            <span className="qb-class-emoji">{classInfo.emoji}</span>
                                            <span className="qb-class-name">{classInfo.name}</span>
                                        </div>
                                        <p className="qb-class-desc">{classInfo.description}</p>
                                        <p className="qb-class-bonus">+{classInfo.bonusPercent}% XP on {classInfo.bonusCategories.slice(0, 2).join(', ')} quests</p>
                                    </div>
                                ))}
                            </div>

                            {/* Selected class details */}
                            <div className="qb-class-details" style={{ borderColor: selectedClassInfo.primaryColor }}>
                                <h4>{selectedClassInfo.emoji} {selectedClassInfo.name}</h4>
                                <p><strong>Perk:</strong> {selectedClassInfo.perkName}</p>
                                <p className="qb-perk-desc">{selectedClassInfo.perkDescription}</p>
                            </div>
                        </div>
                    )}

                    {/* Appearance */}
                    <div className="qb-form-group">
                        <label>Customize Appearance</label>

                        <div className="qb-appearance-row">
                            <span>Skin Tone:</span>
                            <div className="qb-option-buttons">
                                {SKIN_TONES.map((tone) => (
                                    <button
                                        key={tone}
                                        className={appearance.skinTone === tone ? 'selected' : ''}
                                        onClick={() => handleAppearanceChange('skinTone', tone)}
                                    >
                                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="qb-appearance-row">
                            <span>Hair Style:</span>
                            <div className="qb-option-buttons">
                                {HAIR_STYLES.map((style) => (
                                    <button
                                        key={style}
                                        className={appearance.hairStyle === style ? 'selected' : ''}
                                        onClick={() => handleAppearanceChange('hairStyle', style)}
                                    >
                                        {style.charAt(0).toUpperCase() + style.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="qb-appearance-row">
                            <span>Hair Color:</span>
                            <div className="qb-option-buttons">
                                {HAIR_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className={appearance.hairColor === color ? 'selected' : ''}
                                        onClick={() => handleAppearanceChange('hairColor', color)}
                                    >
                                        {color.charAt(0).toUpperCase() + color.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="qb-appearance-row">
                            <span>Accessory:</span>
                            <div className="qb-option-buttons">
                                {ACCESSORIES.map((acc) => (
                                    <button
                                        key={acc}
                                        className={appearance.accessory === acc ? 'selected' : ''}
                                        onClick={() => handleAppearanceChange('accessory', acc)}
                                    >
                                        {acc.charAt(0).toUpperCase() + acc.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="qb-character-preview">
                        <div
                            className="qb-preview-sprite"
                            style={{
                                backgroundColor: selectedClassInfo.primaryColor,
                                color: 'white',
                            }}
                        >
                            <span className="qb-preview-emoji">{selectedClassInfo.emoji}</span>
                        </div>
                        <p className="qb-preview-name">{name || 'Your Name'}</p>
                        <p className="qb-preview-class">Level 1 {selectedClassInfo.name}</p>
                    </div>
                </div>

                <div className="qb-modal-footer">
                    <button className="qb-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="qb-btn-primary"
                        onClick={handleSubmit}
                        style={{ backgroundColor: selectedClassInfo.primaryColor, color: '#1a1a1a' }}
                    >
                        {isEdit ? 'Save Changes' : 'Begin Journey'}
                    </button>
                </div>
            </div>
        </div>
    );
};
