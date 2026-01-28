/**
 * FilterBar Component
 * 
 * Reusable filter bar for Kanban and Sidebar views.
 * Provides search, category/priority/tag/type filters, date range, and sort options.
 * Designed for inline layout in the header.
 */

import React, { useState, useCallback } from 'react';
import { QuestPriority, QuestType } from '../models/QuestStatus';
import { FilterStore, SortOption } from '../store/filterStore';

interface FilterBarProps {
    /** Filter store (Kanban or Sidebar) */
    filterStore: FilterStore;

    /** Available categories to filter by */
    availableCategories: string[];

    /** Available tags to filter by */
    availableTags: string[];

    /** Available quest types (folder names) to filter by */
    availableTypes: string[];

    /** Compact mode for sidebar */
    compact?: boolean;

    /** Mobile mode - consolidate filters into single dropdown */
    isMobile?: boolean;
}

/**
 * Priority display info
 */
const PRIORITY_INFO: Record<QuestPriority, { label: string; emoji: string }> = {
    [QuestPriority.LOW]: { label: 'Low', emoji: '📎' },
    [QuestPriority.MEDIUM]: { label: 'Medium', emoji: '📌' },
    [QuestPriority.HIGH]: { label: 'High', emoji: '🔥' },
    [QuestPriority.CRITICAL]: { label: 'Critical', emoji: '🚨' },
};

/**
 * Quest type display info (fallback for unknown types)
 */
const TYPE_EMOJI: Record<string, string> = {
    'Main': '⚔️',
    'Side': '🗡️',
    'Training': '🎯',
    'Recurring': '🔄',
};

/**
 * Sort option display info
 */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'sortOrder', label: '📋 Custom Order' },
    { value: 'taskCount-desc', label: '📈 Most Tasks' },
    { value: 'taskCount-asc', label: '📉 Fewest Tasks' },
    { value: 'created-desc', label: '🕐 Newest First' },
    { value: 'created-asc', label: '🕐 Oldest First' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
    filterStore,
    availableCategories,
    availableTags,
    availableTypes,
    compact = false,
    isMobile = false,
}) => {
    // Dropdown visibility state
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Mobile filter section expansion state
    const [expandedFilterSections, setExpandedFilterSections] = useState<Set<string>>(new Set());

    const toggleFilterSection = (section: string) => {
        setExpandedFilterSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    // Get filter state directly from store
    const {
        searchQuery,
        selectedCategories,
        selectedPriorities,
        selectedTags,
        selectedTypes,
        dateFrom,
        dateTo,
        sortBy,
        setSearchQuery,
        toggleCategory,
        togglePriority,
        toggleTag,
        toggleType,
        setDateFrom,
        setDateTo,
        setSortBy,
        clearFilters,
        hasActiveFilters,
    } = filterStore;

    const isFiltering = hasActiveFilters();

    // Handle search input
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    // Close all dropdowns
    const closeAllDropdowns = () => {
        setShowCategoryDropdown(false);
        setShowPriorityDropdown(false);
        setShowTagDropdown(false);
        setShowTypeDropdown(false);
        setShowDateDropdown(false);
        setShowSortDropdown(false);
        setShowMobileFilters(false);
    };

    // Toggle dropdown with exclusive open
    const toggleDropdown = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
        closeAllDropdowns();
        setter(!current);
    };

    return (
        <div className={`qb-filter-bar ${compact ? 'qb-filter-bar-compact' : ''} ${isMobile ? 'qb-filter-bar-mobile' : ''}`}>
            {/* Mobile: Consolidated Filters Button */}
            {isMobile ? (
                <div className="qb-filter-buttons qb-mobile-filter-buttons">
                    <div className="qb-filter-dropdown-wrapper">
                        <button
                            className={`qb-filter-btn qb-mobile-filter-toggle ${isFiltering ? 'active' : ''}`}
                            onClick={() => toggleDropdown(setShowMobileFilters, showMobileFilters)}
                        >
                            ⚙️ Filters {isFiltering && '•'}
                        </button>
                        {showMobileFilters && (
                            <div className="qb-filter-dropdown qb-mobile-filter-dropdown">
                                {/* Type Section */}
                                <div className="qb-mobile-filter-section">
                                    <div
                                        className={`qb-mobile-filter-section-title ${expandedFilterSections.has('type') ? 'expanded' : ''}`}
                                        onClick={() => toggleFilterSection('type')}
                                    >
                                        <span>📜 Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}</span>
                                        <span className="qb-section-arrow">{expandedFilterSections.has('type') ? '▼' : '▶'}</span>
                                    </div>
                                    {expandedFilterSections.has('type') && (
                                        availableTypes.length === 0 ? (
                                            <div className="qb-filter-dropdown-empty">No types</div>
                                        ) : (
                                            availableTypes.map(type => (
                                                <label key={type} className="qb-filter-dropdown-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTypes.includes(type)}
                                                        onChange={() => toggleType(type)}
                                                    />
                                                    <span>{TYPE_EMOJI[type] || '📁'} {type}</span>
                                                </label>
                                            ))
                                        )
                                    )}
                                </div>

                                {/* Category Section */}
                                <div className="qb-mobile-filter-section">
                                    <div
                                        className={`qb-mobile-filter-section-title ${expandedFilterSections.has('category') ? 'expanded' : ''}`}
                                        onClick={() => toggleFilterSection('category')}
                                    >
                                        <span>📁 Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}</span>
                                        <span className="qb-section-arrow">{expandedFilterSections.has('category') ? '▼' : '▶'}</span>
                                    </div>
                                    {expandedFilterSections.has('category') && (
                                        availableCategories.length === 0 ? (
                                            <div className="qb-filter-dropdown-empty">No categories</div>
                                        ) : (
                                            availableCategories.map(cat => (
                                                <label key={cat} className="qb-filter-dropdown-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(cat)}
                                                        onChange={() => toggleCategory(cat)}
                                                    />
                                                    <span>{cat}</span>
                                                </label>
                                            ))
                                        )
                                    )}
                                </div>

                                {/* Priority Section */}
                                <div className="qb-mobile-filter-section">
                                    <div
                                        className={`qb-mobile-filter-section-title ${expandedFilterSections.has('priority') ? 'expanded' : ''}`}
                                        onClick={() => toggleFilterSection('priority')}
                                    >
                                        <span>⚡ Priority {selectedPriorities.length > 0 && `(${selectedPriorities.length})`}</span>
                                        <span className="qb-section-arrow">{expandedFilterSections.has('priority') ? '▼' : '▶'}</span>
                                    </div>
                                    {expandedFilterSections.has('priority') && (
                                        Object.entries(PRIORITY_INFO).map(([priority, info]) => (
                                            <label key={priority} className="qb-filter-dropdown-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPriorities.includes(priority as QuestPriority)}
                                                    onChange={() => togglePriority(priority as QuestPriority)}
                                                />
                                                <span>{info.emoji} {info.label}</span>
                                            </label>
                                        ))
                                    )}
                                </div>

                                {/* Tags Section */}
                                <div className="qb-mobile-filter-section">
                                    <div
                                        className={`qb-mobile-filter-section-title ${expandedFilterSections.has('tags') ? 'expanded' : ''}`}
                                        onClick={() => toggleFilterSection('tags')}
                                    >
                                        <span>🏷️ Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                                        <span className="qb-section-arrow">{expandedFilterSections.has('tags') ? '▼' : '▶'}</span>
                                    </div>
                                    {expandedFilterSections.has('tags') && (
                                        availableTags.length === 0 ? (
                                            <div className="qb-filter-dropdown-empty">No tags</div>
                                        ) : (
                                            availableTags.slice(0, 10).map(tag => (
                                                <label key={tag} className="qb-filter-dropdown-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTags.includes(tag)}
                                                        onChange={() => toggleTag(tag)}
                                                    />
                                                    <span>#{tag}</span>
                                                </label>
                                            ))
                                        )
                                    )}
                                </div>

                                {/* Sort Section */}
                                <div className="qb-mobile-filter-section">
                                    <div
                                        className={`qb-mobile-filter-section-title ${expandedFilterSections.has('sort') ? 'expanded' : ''}`}
                                        onClick={() => toggleFilterSection('sort')}
                                    >
                                        <span>⇅ Sort</span>
                                        <span className="qb-section-arrow">{expandedFilterSections.has('sort') ? '▼' : '▶'}</span>
                                    </div>
                                    {expandedFilterSections.has('sort') && (
                                        SORT_OPTIONS.map(option => (
                                            <label key={option.value} className="qb-filter-dropdown-item">
                                                <input
                                                    type="radio"
                                                    name="mobile-sort"
                                                    checked={sortBy === option.value}
                                                    onChange={() => setSortBy(option.value)}
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        ))
                                    )}
                                </div>

                                {/* Clear All */}
                                {isFiltering && (
                                    <button
                                        className="qb-mobile-filter-clear"
                                        onClick={clearFilters}
                                    >
                                        ✕ Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Desktop: Filter Buttons - come first, fixed width */
                <div className="qb-filter-buttons">
                    {/* Type Filter */}
                    <div className="qb-filter-dropdown-wrapper">
                        <button
                            className={`qb-filter-btn ${selectedTypes.length > 0 ? 'active' : ''}`}
                            onClick={() => toggleDropdown(setShowTypeDropdown, showTypeDropdown)}
                        >
                            📜 Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}
                        </button>
                        {showTypeDropdown && (
                            <div className="qb-filter-dropdown">
                                {availableTypes.length === 0 ? (
                                    <div className="qb-filter-dropdown-empty">No types</div>
                                ) : (
                                    availableTypes.map(type => (
                                        <label key={type} className="qb-filter-dropdown-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.includes(type)}
                                                onChange={() => toggleType(type)}
                                            />
                                            <span>{TYPE_EMOJI[type] || '📄'} {type}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className="qb-filter-dropdown-wrapper">
                        <button
                            className={`qb-filter-btn ${selectedCategories.length > 0 ? 'active' : ''}`}
                            onClick={() => toggleDropdown(setShowCategoryDropdown, showCategoryDropdown)}
                        >
                            📁 Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                        </button>
                        {showCategoryDropdown && (
                            <div className="qb-filter-dropdown">
                                {availableCategories.length === 0 ? (
                                    <div className="qb-filter-dropdown-empty">No categories</div>
                                ) : (
                                    availableCategories.map(category => (
                                        <label key={category} className="qb-filter-dropdown-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category)}
                                                onChange={() => toggleCategory(category)}
                                            />
                                            <span>{category}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Priority Filter */}
                    <div className="qb-filter-dropdown-wrapper">
                        <button
                            className={`qb-filter-btn ${selectedPriorities.length > 0 ? 'active' : ''}`}
                            onClick={() => toggleDropdown(setShowPriorityDropdown, showPriorityDropdown)}
                        >
                            ⚡ Priority {selectedPriorities.length > 0 && `(${selectedPriorities.length})`}
                        </button>
                        {showPriorityDropdown && (
                            <div className="qb-filter-dropdown">
                                {Object.entries(PRIORITY_INFO).map(([priority, info]) => (
                                    <label key={priority} className="qb-filter-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedPriorities.includes(priority as QuestPriority)}
                                            onChange={() => togglePriority(priority as QuestPriority)}
                                        />
                                        <span>{info.emoji} {info.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tags Filter - only show if tags exist */}
                    {availableTags.length > 0 && (
                        <div className="qb-filter-dropdown-wrapper">
                            <button
                                className={`qb-filter-btn ${selectedTags.length > 0 ? 'active' : ''}`}
                                onClick={() => toggleDropdown(setShowTagDropdown, showTagDropdown)}
                            >
                                🏷️ Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                            </button>
                            {showTagDropdown && (
                                <div className="qb-filter-dropdown">
                                    {availableTags.map(tag => (
                                        <label key={tag} className="qb-filter-dropdown-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedTags.includes(tag)}
                                                onChange={() => toggleTag(tag)}
                                            />
                                            <span>{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date Range Filter */}
                    <div className="qb-filter-dropdown-wrapper">
                        <button
                            className={`qb-filter-btn ${dateFrom || dateTo ? 'active' : ''}`}
                            onClick={() => toggleDropdown(setShowDateDropdown, showDateDropdown)}
                        >
                            📅 {(dateFrom || dateTo) && '✓'}
                        </button>
                        {showDateDropdown && (
                            <div className="qb-filter-dropdown qb-filter-date-dropdown">
                                <div className="qb-filter-date-row">
                                    <label>From:</label>
                                    <input
                                        type="date"
                                        value={dateFrom || ''}
                                        onChange={(e) => setDateFrom(e.target.value || null)}
                                    />
                                </div>
                                <div className="qb-filter-date-row">
                                    <label>To:</label>
                                    <input
                                        type="date"
                                        value={dateTo || ''}
                                        onChange={(e) => setDateTo(e.target.value || null)}
                                    />
                                </div>
                                {(dateFrom || dateTo) && (
                                    <button
                                        className="qb-filter-date-clear"
                                        onClick={() => { setDateFrom(null); setDateTo(null); }}
                                    >
                                        Clear dates
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="qb-filter-dropdown-wrapper">
                        <button
                            className={`qb-filter-btn ${sortBy !== 'sortOrder' ? 'active' : ''}`}
                            onClick={() => toggleDropdown(setShowSortDropdown, showSortDropdown)}
                        >
                            ⇅
                        </button>
                        {showSortDropdown && (
                            <div className="qb-filter-dropdown">
                                {SORT_OPTIONS.map(option => (
                                    <label key={option.value} className="qb-filter-dropdown-item">
                                        <input
                                            type="radio"
                                            name="sort"
                                            checked={sortBy === option.value}
                                            onChange={() => setSortBy(option.value)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clear All Button */}
                    {isFiltering && (
                        <button
                            className="qb-filter-clear-btn"
                            onClick={clearFilters}
                            title="Clear all filters"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {/* Divider */}
            <span className="qb-filter-divider">|</span>

            {/* Search Input - takes remaining space */}
            <div className="qb-filter-search">
                <span className="qb-filter-search-icon">🔍</span>
                <input
                    type="text"
                    className="qb-filter-search-input"
                    placeholder="Search quests..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                {searchQuery && (
                    <button
                        className="qb-filter-search-clear"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Click outside to close dropdowns */}
            {(showCategoryDropdown || showPriorityDropdown || showTagDropdown || showTypeDropdown || showDateDropdown || showSortDropdown) && (
                <div
                    className="qb-filter-backdrop"
                    onClick={closeAllDropdowns}
                />
            )}
        </div>
    );
};
