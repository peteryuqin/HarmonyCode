"use strict";
/**
 * Diversity Enforcer for Anti-Echo-Chamber System
 * Actively enforces intellectual diversity and prevents groupthink
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiversityEnforcer = void 0;
const diversity_tracker_1 = require("./diversity-tracker");
const perspective_analyzer_1 = require("./perspective-analyzer");
class DiversityEnforcer {
    constructor(config, requirements, tracker, analyzer) {
        this.interventionHistory = new Map();
        this.enforcementMetrics = {
            totalChecks: 0,
            interventions: 0,
            perspectiveRotations: 0,
            forcedDisagreements: 0,
            evidenceRequests: 0
        };
        this.config = config;
        this.requirements = requirements;
        this.tracker = tracker || new diversity_tracker_1.DiversityTracker(config);
        this.analyzer = analyzer || new perspective_analyzer_1.PerspectiveAnalyzer();
    }
    /**
     * Check if a contribution meets diversity requirements
     */
    async enforceContribution(context) {
        this.enforcementMetrics.totalChecks++;
        // Skip enforcement if disabled or insufficient agents
        if (!this.config.enabled || context.otherAgents.length < this.config.minimumAgentsForDiversity - 1) {
            return { allowed: true, score: 1.0 };
        }
        // Analyze the contribution
        const analysis = this.analyzer.analyzeStatement(context.agentId, context.content, this.getRecentContext(context.otherAgents));
        // Get current diversity metrics
        const metrics = this.tracker.getDiversityMetrics();
        // Check various diversity requirements
        const checks = [
            this.checkEchoChamber(analysis, metrics),
            this.checkDisagreementQuota(analysis, metrics),
            this.checkEvidenceRequirement(context, analysis),
            this.checkPerspectiveDiversity(context, metrics),
            this.checkConsensusSpeed(metrics)
        ];
        // Find the most severe intervention needed
        const interventions = checks.filter(c => c.intervention);
        const mostSevereIntervention = this.selectMostSevereIntervention(interventions);
        if (mostSevereIntervention) {
            this.enforcementMetrics.interventions++;
            this.recordIntervention(context.agentId, mostSevereIntervention.intervention);
            return {
                allowed: !this.config.strictMode,
                intervention: mostSevereIntervention.intervention,
                modifiedContent: this.config.strictMode ? undefined : this.modifyContent(context, mostSevereIntervention),
                requiredActions: this.generateRequiredActions(mostSevereIntervention),
                score: mostSevereIntervention.score
            };
        }
        // Record successful contribution
        this.tracker.recordDecision(context.agentId, context.content, analysis.detectedPerspective.toString(), !analysis.isEchoing, analysis.evidenceQuality > 0.5, analysis.diversityContribution > 0.7);
        return {
            allowed: true,
            score: analysis.diversityContribution
        };
    }
    /**
     * Force perspective rotation for an agent
     */
    forcePerspectiveRotation(agentId) {
        this.enforcementMetrics.perspectiveRotations++;
        const newPerspective = this.tracker.rotatePerspective(agentId);
        const intervention = {
            type: 'ROTATE_PERSPECTIVE',
            reason: 'Scheduled perspective rotation to maintain diversity',
            targetAgent: agentId,
            requiredAction: `Adopt ${newPerspective} perspective for next contributions`,
            deadline: new Date(Date.now() + this.requirements.perspectiveRotationInterval * 60000)
        };
        this.recordIntervention(agentId, intervention);
        return newPerspective;
    }
    /**
     * Get enforcement recommendations for a team
     */
    getTeamRecommendations(agentIds) {
        const metrics = this.tracker.getDiversityMetrics();
        const teamCheck = this.tracker.checkDiversityRequirements(agentIds);
        const recommendations = [];
        // Check if team meets basic diversity
        if (!teamCheck.meets) {
            recommendations.push(`Add agents with perspectives: ${teamCheck.missing.join(', ')}`);
        }
        // Check agreement rate
        if (metrics.agreementRate > 0.7) {
            recommendations.push('Assign devil\'s advocate role to break agreement pattern');
        }
        // Check evidence rate
        if (metrics.evidenceRate < this.requirements.evidenceThreshold) {
            recommendations.push('Increase evidence requirements for all claims');
        }
        // Check consensus speed
        if (metrics.lastConsensusSpeed > 3) {
            recommendations.push('Enforce exploration phase before allowing consensus');
        }
        // Check minority perspectives
        if (metrics.minorityPerspectivesPreserved < 2) {
            recommendations.push('Protect minority viewpoints by requiring their input');
        }
        return recommendations;
    }
    /**
     * Create intervention for a specific situation
     */
    createIntervention(type, agentId, reason) {
        const interventionActions = {
            FORCE_DISAGREEMENT: [
                'Challenge the main assumption in the current consensus',
                'Identify three potential flaws or risks',
                'Propose an alternative approach',
                'Play devil\'s advocate on the key decision'
            ],
            REQUEST_EVIDENCE: [
                'Provide empirical data supporting your claim',
                'Include at least two independent sources',
                'Show metrics or benchmarks',
                'Present a relevant case study'
            ],
            ROTATE_PERSPECTIVE: [
                'Approach the problem from a different angle',
                'Consider the opposite viewpoint',
                'Think like a different stakeholder',
                'Challenge your own assumptions'
            ],
            ADD_PERSPECTIVE: [
                'Introduce a viewpoint not yet considered',
                'Think outside the current framing',
                'Consider edge cases and exceptions',
                'Bring in expertise from another domain'
            ]
        };
        const actions = interventionActions[type];
        const selectedAction = actions[Math.floor(Math.random() * actions.length)];
        return {
            type,
            reason,
            targetAgent: agentId,
            requiredAction: selectedAction,
            deadline: new Date(Date.now() + 5 * 60000) // 5 minutes
        };
    }
    // Private enforcement check methods
    checkEchoChamber(analysis, metrics) {
        if (analysis.isEchoing && analysis.echoPatterns.some(p => p.severity === 'HIGH')) {
            this.enforcementMetrics.forcedDisagreements++;
            return {
                intervention: {
                    type: 'FORCE_DISAGREEMENT',
                    reason: 'Echo chamber pattern detected: ' + analysis.echoPatterns[0].description,
                    targetAgent: '',
                    requiredAction: 'Provide a contrasting viewpoint or challenge an assumption',
                    deadline: new Date(Date.now() + 5 * 60000)
                },
                score: 0.2
            };
        }
        return { score: analysis.diversityContribution };
    }
    checkDisagreementQuota(analysis, metrics) {
        const disagreementDeficit = this.requirements.disagreementQuota - (1 - metrics.agreementRate);
        if (disagreementDeficit > 0.1 && Math.random() < disagreementDeficit) {
            return {
                intervention: {
                    type: 'FORCE_DISAGREEMENT',
                    reason: `Disagreement quota not met (current: ${((1 - metrics.agreementRate) * 100).toFixed(1)}%, required: ${(this.requirements.disagreementQuota * 100)}%)`,
                    targetAgent: '',
                    requiredAction: 'Express disagreement or identify limitations',
                    deadline: new Date(Date.now() + 5 * 60000)
                },
                score: 0.3
            };
        }
        return { score: 1.0 };
    }
    checkEvidenceRequirement(context, analysis) {
        if (context.messageType === 'decision' && analysis.evidenceQuality < this.requirements.evidenceThreshold) {
            this.enforcementMetrics.evidenceRequests++;
            return {
                intervention: {
                    type: 'REQUEST_EVIDENCE',
                    reason: `Evidence score too low (${(analysis.evidenceQuality * 100).toFixed(1)}% < ${(this.requirements.evidenceThreshold * 100)}%)`,
                    targetAgent: context.agentId,
                    requiredAction: 'Support your claim with data, studies, or examples',
                    deadline: new Date(Date.now() + 10 * 60000)
                },
                score: analysis.evidenceQuality
            };
        }
        return { score: 1.0 };
    }
    checkPerspectiveDiversity(context, metrics) {
        if (metrics.overallDiversity < this.requirements.minimumDiversity) {
            return {
                intervention: {
                    type: 'ADD_PERSPECTIVE',
                    reason: `Diversity score too low (${(metrics.overallDiversity * 100).toFixed(1)}% < ${(this.requirements.minimumDiversity * 100)}%)`,
                    targetAgent: context.agentId,
                    requiredAction: 'Introduce a perspective not yet represented',
                    deadline: new Date(Date.now() + 5 * 60000)
                },
                score: metrics.overallDiversity
            };
        }
        return { score: 1.0 };
    }
    checkConsensusSpeed(metrics) {
        if (metrics.lastConsensusSpeed > 4) {
            return {
                intervention: {
                    type: 'FORCE_DISAGREEMENT',
                    reason: 'Consensus reached too quickly without exploring alternatives',
                    targetAgent: '',
                    requiredAction: 'Propose an alternative before agreeing',
                    deadline: new Date(Date.now() + 5 * 60000)
                },
                score: 0.4
            };
        }
        return { score: 1.0 };
    }
    // Helper methods
    selectMostSevereIntervention(checks) {
        const withInterventions = checks.filter(c => c.intervention);
        if (withInterventions.length === 0) {
            return { score: 1.0 };
        }
        // Sort by score (lower = more severe)
        withInterventions.sort((a, b) => a.score - b.score);
        return withInterventions[0];
    }
    modifyContent(context, check) {
        const prefix = check.intervention?.type === 'FORCE_DISAGREEMENT'
            ? 'While I understand the prevailing view, I must point out that '
            : check.intervention?.type === 'REQUEST_EVIDENCE'
                ? 'Based on the following evidence: [EVIDENCE NEEDED], '
                : '';
        return prefix + context.content;
    }
    generateRequiredActions(check) {
        if (!check.intervention)
            return [];
        const actions = [check.intervention.requiredAction];
        // Add type-specific additional actions
        switch (check.intervention.type) {
            case 'FORCE_DISAGREEMENT':
                actions.push('Identify assumptions that haven\'t been questioned');
                actions.push('Consider what could go wrong with the current approach');
                break;
            case 'REQUEST_EVIDENCE':
                actions.push('Cite specific data or studies');
                actions.push('Provide quantitative metrics when possible');
                break;
            case 'ADD_PERSPECTIVE':
                actions.push('Think from a different stakeholder\'s viewpoint');
                actions.push('Consider long-term implications');
                break;
        }
        return actions;
    }
    getRecentContext(agentIds) {
        // In a real implementation, this would fetch recent statements from these agents
        // For now, returning empty array
        return [];
    }
    recordIntervention(agentId, intervention) {
        const history = this.interventionHistory.get(agentId) || [];
        history.push(intervention);
        // Keep only recent interventions
        if (history.length > 10) {
            history.shift();
        }
        this.interventionHistory.set(agentId, history);
    }
    /**
     * Get enforcement metrics
     */
    getMetrics() {
        return {
            ...this.enforcementMetrics,
            diversityMetrics: this.tracker.getDiversityMetrics(),
            interventionRate: this.enforcementMetrics.interventions / Math.max(this.enforcementMetrics.totalChecks, 1)
        };
    }
}
exports.DiversityEnforcer = DiversityEnforcer;
//# sourceMappingURL=diversity-enforcer.js.map