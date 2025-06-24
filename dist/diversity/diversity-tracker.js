"use strict";
/**
 * Diversity Tracker for Anti-Echo-Chamber System
 * Tracks agent perspectives and maintains diversity metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiversityTracker = void 0;
const types_1 = require("./types");
class DiversityTracker {
    constructor(config) {
        this.agentPerspectives = new Map();
        this.decisionHistory = [];
        this.metricsCache = null;
        this.lastMetricsUpdate = null;
        this.config = config;
    }
    /**
     * Register an agent with their initial perspective
     */
    registerAgent(agentId, initialProfile) {
        const profile = initialProfile || this.assignRandomPerspective();
        const perspective = {
            agentId,
            profile,
            perspectiveScore: this.calculatePerspectiveScores(profile),
            history: [],
            lastRotation: new Date()
        };
        this.agentPerspectives.set(agentId, perspective);
        this.invalidateMetricsCache();
    }
    /**
     * Record a decision made by an agent
     */
    recordDecision(agentId, decision, perspective, agreedWithMajority, evidenceProvided, challengedAssumptions) {
        const agent = this.agentPerspectives.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not registered`);
        }
        const historyEntry = {
            timestamp: new Date(),
            decision,
            perspective,
            agreedWithMajority,
            evidenceProvided,
            challengedAssumptions
        };
        agent.history.push(historyEntry);
        this.decisionHistory.push(historyEntry);
        this.invalidateMetricsCache();
        // Check if perspective rotation is needed
        if (this.config.autoRotation && this.shouldRotatePerspective(agent)) {
            this.rotatePerspective(agentId);
        }
    }
    /**
     * Get current diversity metrics
     */
    getDiversityMetrics() {
        if (!this.metricsCache || this.isMetricsCacheStale()) {
            this.metricsCache = this.calculateDiversityMetrics();
            this.lastMetricsUpdate = new Date();
        }
        return this.metricsCache;
    }
    /**
     * Check if a team meets diversity requirements
     */
    checkDiversityRequirements(agentIds) {
        const teamPerspectives = agentIds
            .map(id => this.agentPerspectives.get(id))
            .filter(p => p !== undefined);
        // Calculate perspective diversity
        const uniquePerspectives = new Set(teamPerspectives.map(p => p.profile));
        const diversityScore = uniquePerspectives.size / Math.max(teamPerspectives.length, 1);
        // Check for missing critical perspectives
        const missingPerspectives = [];
        const criticalPerspectives = [
            types_1.PerspectiveProfile.SKEPTIC,
            types_1.PerspectiveProfile.ANALYTICAL,
            types_1.PerspectiveProfile.CONSERVATIVE
        ];
        criticalPerspectives.forEach(perspective => {
            if (!uniquePerspectives.has(perspective) && teamPerspectives.length >= 3) {
                missingPerspectives.push(perspective);
            }
        });
        return {
            meets: diversityScore >= 0.5 && missingPerspectives.length === 0,
            missing: missingPerspectives,
            score: diversityScore
        };
    }
    /**
     * Rotate agent perspective to maintain diversity
     */
    rotatePerspective(agentId) {
        const agent = this.agentPerspectives.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not registered`);
        }
        // Get current perspective distribution
        const distribution = this.getPerspectiveDistribution();
        // Find underrepresented perspectives
        const underrepresented = this.findUnderrepresentedPerspectives(distribution);
        // Assign new perspective
        const newProfile = underrepresented.length > 0
            ? underrepresented[Math.floor(Math.random() * underrepresented.length)]
            : this.assignRandomPerspective();
        agent.profile = newProfile;
        agent.perspectiveScore = this.calculatePerspectiveScores(newProfile);
        agent.lastRotation = new Date();
        this.invalidateMetricsCache();
        return newProfile;
    }
    /**
     * Get agents with specific perspective
     */
    getAgentsByPerspective(profile) {
        return Array.from(this.agentPerspectives.entries())
            .filter(([_, agent]) => agent.profile === profile)
            .map(([id, _]) => id);
    }
    /**
     * Calculate diversity score between two agents
     */
    calculatePerspectiveDifference(agentId1, agentId2) {
        const agent1 = this.agentPerspectives.get(agentId1);
        const agent2 = this.agentPerspectives.get(agentId2);
        if (!agent1 || !agent2) {
            throw new Error('One or both agents not registered');
        }
        const scores1 = agent1.perspectiveScore;
        const scores2 = agent2.perspectiveScore;
        // Calculate Euclidean distance between perspective scores
        const differences = [
            Math.abs(scores1.riskTolerance - scores2.riskTolerance),
            Math.abs(scores1.innovationBias - scores2.innovationBias),
            Math.abs(scores1.evidencePreference - scores2.evidencePreference),
            Math.abs(scores1.decisionSpeed - scores2.decisionSpeed),
            Math.abs(scores1.conflictTolerance - scores2.conflictTolerance)
        ];
        const distance = Math.sqrt(differences.reduce((sum, diff) => sum + diff * diff, 0));
        return distance / Math.sqrt(5); // Normalize to 0-1
    }
    /**
     * Get recommendation for improving diversity
     */
    getDiversityRecommendations(currentAgentIds) {
        const recommendations = [];
        const metrics = this.getDiversityMetrics();
        const teamCheck = this.checkDiversityRequirements(currentAgentIds);
        if (metrics.agreementRate > 0.7) {
            recommendations.push('Agreement rate too high - assign devil\'s advocate role');
        }
        if (metrics.evidenceRate < 0.5) {
            recommendations.push('Evidence rate too low - require evidence for all claims');
        }
        if (teamCheck.missing.length > 0) {
            recommendations.push(`Add agents with perspectives: ${teamCheck.missing.join(', ')}`);
        }
        if (metrics.lastConsensusSpeed < 5) {
            recommendations.push('Consensus reached too quickly - enforce exploration phase');
        }
        return recommendations;
    }
    // Private helper methods
    assignRandomPerspective() {
        const profiles = Object.values(types_1.PerspectiveProfile);
        return profiles[Math.floor(Math.random() * profiles.length)];
    }
    calculatePerspectiveScores(profile) {
        // Define characteristic scores for each profile
        const profileScores = {
            [types_1.PerspectiveProfile.OPTIMIST]: {
                riskTolerance: 0.8,
                innovationBias: 0.7,
                evidencePreference: 0.4,
                decisionSpeed: 0.7,
                conflictTolerance: 0.3
            },
            [types_1.PerspectiveProfile.SKEPTIC]: {
                riskTolerance: 0.2,
                innovationBias: 0.3,
                evidencePreference: 0.9,
                decisionSpeed: 0.3,
                conflictTolerance: 0.8
            },
            [types_1.PerspectiveProfile.PRAGMATIST]: {
                riskTolerance: 0.5,
                innovationBias: 0.5,
                evidencePreference: 0.7,
                decisionSpeed: 0.6,
                conflictTolerance: 0.5
            },
            [types_1.PerspectiveProfile.INNOVATOR]: {
                riskTolerance: 0.9,
                innovationBias: 0.9,
                evidencePreference: 0.3,
                decisionSpeed: 0.8,
                conflictTolerance: 0.6
            },
            [types_1.PerspectiveProfile.CONSERVATIVE]: {
                riskTolerance: 0.1,
                innovationBias: 0.2,
                evidencePreference: 0.8,
                decisionSpeed: 0.2,
                conflictTolerance: 0.2
            },
            [types_1.PerspectiveProfile.ANALYTICAL]: {
                riskTolerance: 0.4,
                innovationBias: 0.5,
                evidencePreference: 0.95,
                decisionSpeed: 0.2,
                conflictTolerance: 0.6
            },
            [types_1.PerspectiveProfile.CREATIVE]: {
                riskTolerance: 0.7,
                innovationBias: 0.85,
                evidencePreference: 0.2,
                decisionSpeed: 0.8,
                conflictTolerance: 0.7
            },
            [types_1.PerspectiveProfile.DETAIL_ORIENTED]: {
                riskTolerance: 0.3,
                innovationBias: 0.4,
                evidencePreference: 0.85,
                decisionSpeed: 0.1,
                conflictTolerance: 0.4
            },
            [types_1.PerspectiveProfile.BIG_PICTURE]: {
                riskTolerance: 0.6,
                innovationBias: 0.7,
                evidencePreference: 0.4,
                decisionSpeed: 0.9,
                conflictTolerance: 0.5
            }
        };
        return profileScores[profile];
    }
    calculateDiversityMetrics() {
        const recentHistory = this.getRecentHistory(100);
        const distribution = this.getPerspectiveDistribution();
        // Calculate agreement rate
        const agreementRate = recentHistory.filter(h => h.agreedWithMajority).length /
            Math.max(recentHistory.length, 1);
        // Calculate evidence rate
        const evidenceRate = recentHistory.filter(h => h.evidenceProvided).length /
            Math.max(recentHistory.length, 1);
        // Calculate challenge rate
        const challengeRate = recentHistory.filter(h => h.challengedAssumptions).length /
            Math.max(recentHistory.length, 1);
        // Calculate diversity score
        const totalAgents = this.agentPerspectives.size;
        const uniquePerspectives = distribution.size;
        const overallDiversity = uniquePerspectives / Math.max(totalAgents, 1);
        // Calculate consensus speed (mock - would need actual timing data)
        const lastConsensusSpeed = this.calculateConsensusSpeed(recentHistory);
        // Count preserved minority perspectives
        const minorityPerspectivesPreserved = Array.from(distribution.values())
            .filter(count => count === 1).length;
        return {
            overallDiversity,
            perspectiveDistribution: distribution,
            agreementRate,
            evidenceRate,
            challengeRate,
            lastConsensusSpeed,
            minorityPerspectivesPreserved
        };
    }
    getRecentHistory(count) {
        return this.decisionHistory.slice(-count);
    }
    getPerspectiveDistribution() {
        const distribution = new Map();
        this.agentPerspectives.forEach(agent => {
            const current = distribution.get(agent.profile) || 0;
            distribution.set(agent.profile, current + 1);
        });
        return distribution;
    }
    findUnderrepresentedPerspectives(distribution) {
        const totalAgents = this.agentPerspectives.size;
        const targetCount = Math.ceil(totalAgents / Object.values(types_1.PerspectiveProfile).length);
        const underrepresented = [];
        Object.values(types_1.PerspectiveProfile).forEach(profile => {
            const count = distribution.get(profile) || 0;
            if (count < targetCount * 0.5) {
                underrepresented.push(profile);
            }
        });
        return underrepresented;
    }
    shouldRotatePerspective(agent) {
        if (!agent.lastRotation)
            return true;
        const timeSinceRotation = Date.now() - agent.lastRotation.getTime();
        const rotationInterval = this.config.autoRotation ? 30 * 60 * 1000 : Infinity; // 30 minutes
        // Check if agent is agreeing too much
        const recentDecisions = agent.history.slice(-10);
        const agreementRate = recentDecisions.filter(d => d.agreedWithMajority).length /
            Math.max(recentDecisions.length, 1);
        return timeSinceRotation > rotationInterval || agreementRate > 0.8;
    }
    calculateConsensusSpeed(history) {
        // Simplified calculation - in real implementation would track actual decision timings
        if (history.length < 5)
            return 0;
        const lastFive = history.slice(-5);
        const agreementStreak = lastFive.filter(h => h.agreedWithMajority).length;
        return agreementStreak; // Higher number = faster consensus
    }
    invalidateMetricsCache() {
        this.metricsCache = null;
    }
    isMetricsCacheStale() {
        if (!this.lastMetricsUpdate)
            return true;
        const cacheAge = Date.now() - this.lastMetricsUpdate.getTime();
        return cacheAge > 5000; // 5 seconds
    }
}
exports.DiversityTracker = DiversityTracker;
//# sourceMappingURL=diversity-tracker.js.map