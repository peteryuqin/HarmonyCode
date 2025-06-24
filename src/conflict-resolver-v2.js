/**
 * HarmonyCode Conflict Resolver v2
 * Improved conflict resolution for multi-AI collaboration
 * Built by Session 3 based on lessons learned
 */

class ConflictResolverV2 {
    constructor() {
        this.editHistory = [];
        this.conflictStrategies = {
            'same-line': this.mergeSameLine.bind(this),
            'overlapping': this.mergeOverlapping.bind(this),
            'sequential': this.applySequential.bind(this),
            'conflicting': this.resolveByPriority.bind(this)
        };
        this.sessionPriorities = new Map(); // Track session performance
    }

    /**
     * Process multiple edits from different sessions
     * Preserves edit order and handles 3-way conflicts
     */
    processEdits(edits) {
        // Sort edits by timestamp to preserve order
        const sortedEdits = edits.sort((a, b) => a.timestamp - b.timestamp);
        
        // Group edits by conflict potential
        const editGroups = this.groupConflictingEdits(sortedEdits);
        
        // Process each group with appropriate strategy
        const results = [];
        for (const group of editGroups) {
            if (group.length === 1) {
                // No conflict - apply directly
                results.push(this.applyEdit(group[0]));
            } else {
                // Multiple edits - resolve conflict
                const resolved = this.resolveConflictGroup(group);
                results.push(resolved);
            }
        }
        
        return results;
    }

    /**
     * Group edits that might conflict with each other
     */
    groupConflictingEdits(edits) {
        const groups = [];
        const processed = new Set();
        
        for (let i = 0; i < edits.length; i++) {
            if (processed.has(i)) continue;
            
            const group = [edits[i]];
            processed.add(i);
            
            // Find all edits that conflict with this one
            for (let j = i + 1; j < edits.length; j++) {
                if (processed.has(j)) continue;
                
                if (this.editsConflict(edits[i], edits[j])) {
                    group.push(edits[j]);
                    processed.add(j);
                }
            }
            
            groups.push(group);
        }
        
        return groups;
    }

    /**
     * Check if two edits conflict
     */
    editsConflict(edit1, edit2) {
        // Same file check
        if (edit1.file !== edit2.file) return false;
        
        // Line range overlap check
        const start1 = edit1.startLine;
        const end1 = edit1.endLine || start1;
        const start2 = edit2.startLine;
        const end2 = edit2.endLine || start2;
        
        return !(end1 < start2 || end2 < start1);
    }

    /**
     * Resolve a group of conflicting edits
     */
    resolveConflictGroup(edits) {
        // Determine conflict type
        const conflictType = this.determineConflictType(edits);
        
        // Apply appropriate strategy
        const strategy = this.conflictStrategies[conflictType];
        if (strategy) {
            return strategy(edits);
        }
        
        // Fallback: use priority-based resolution
        return this.resolveByPriority(edits);
    }

    /**
     * Merge edits on the same line (e.g., different parts of line)
     */
    mergeSameLine(edits) {
        // Sort by column position
        const sorted = edits.sort((a, b) => (a.startColumn || 0) - (b.startColumn || 0));
        
        // Combine non-overlapping edits
        let mergedContent = '';
        let lastEnd = 0;
        
        for (const edit of sorted) {
            const start = edit.startColumn || 0;
            if (start >= lastEnd) {
                mergedContent += edit.content;
                lastEnd = start + edit.content.length;
            }
        }
        
        return {
            type: 'merged',
            file: edits[0].file,
            startLine: edits[0].startLine,
            content: mergedContent,
            sessions: edits.map(e => e.sessionId),
            strategy: 'same-line-merge'
        };
    }

    /**
     * Merge overlapping edits by combining unique parts
     */
    mergeOverlapping(edits) {
        // Extract unique content from each edit
        const contents = edits.map(e => e.content);
        const merged = this.intelligentMerge(contents);
        
        return {
            type: 'merged',
            file: edits[0].file,
            startLine: Math.min(...edits.map(e => e.startLine)),
            endLine: Math.max(...edits.map(e => e.endLine || e.startLine)),
            content: merged,
            sessions: edits.map(e => e.sessionId),
            strategy: 'overlapping-merge'
        };
    }

    /**
     * Apply edits sequentially (for non-conflicting sequential edits)
     */
    applySequential(edits) {
        return edits.map(edit => this.applyEdit(edit));
    }

    /**
     * Resolve by session priority (based on past performance)
     */
    resolveByPriority(edits) {
        // Sort by session priority
        const sorted = edits.sort((a, b) => {
            const priorityA = this.sessionPriorities.get(a.sessionId) || 0;
            const priorityB = this.sessionPriorities.get(b.sessionId) || 0;
            return priorityB - priorityA;
        });
        
        // Take the highest priority edit
        const chosen = sorted[0];
        
        return {
            ...chosen,
            strategy: 'priority-based',
            alternates: sorted.slice(1)
        };
    }

    /**
     * Intelligent merge of multiple content versions
     */
    intelligentMerge(contents) {
        // Simple version: combine unique lines
        const allLines = contents.flatMap(c => c.split('\n'));
        const uniqueLines = [...new Set(allLines)];
        return uniqueLines.join('\n');
    }

    /**
     * Apply a single edit
     */
    applyEdit(edit) {
        this.editHistory.push({
            ...edit,
            appliedAt: Date.now()
        });
        
        return {
            ...edit,
            status: 'applied'
        };
    }

    /**
     * Determine the type of conflict
     */
    determineConflictType(edits) {
        // All edits on same line
        if (edits.every(e => e.startLine === edits[0].startLine && !e.endLine)) {
            return 'same-line';
        }
        
        // Overlapping line ranges
        if (this.hasOverlap(edits)) {
            return 'overlapping';
        }
        
        // Sequential (shouldn't happen in conflict group)
        return 'conflicting';
    }

    /**
     * Check if edits have overlapping ranges
     */
    hasOverlap(edits) {
        for (let i = 0; i < edits.length - 1; i++) {
            for (let j = i + 1; j < edits.length; j++) {
                if (this.editsConflict(edits[i], edits[j])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Update session priority based on successful edits
     */
    updateSessionPriority(sessionId, success) {
        const current = this.sessionPriorities.get(sessionId) || 0;
        const delta = success ? 1 : -0.5;
        this.sessionPriorities.set(sessionId, current + delta);
    }

    /**
     * Get conflict resolution statistics
     */
    getStats() {
        const stats = {
            totalEdits: this.editHistory.length,
            byStrategy: {},
            bySession: {}
        };
        
        for (const edit of this.editHistory) {
            // Count by strategy
            const strategy = edit.strategy || 'direct';
            stats.byStrategy[strategy] = (stats.byStrategy[strategy] || 0) + 1;
            
            // Count by session
            const session = edit.sessionId;
            stats.bySession[session] = (stats.bySession[session] || 0) + 1;
        }
        
        return stats;
    }
}

module.exports = ConflictResolverV2;