/**
 * Diversity Tracker for Anti-Echo-Chamber System
 * Tracks agent perspectives and maintains diversity metrics
 */
import { PerspectiveProfile, DiversityMetrics, DiversityConfig } from './types';
export declare class DiversityTracker {
    private agentPerspectives;
    private decisionHistory;
    private config;
    private metricsCache;
    private lastMetricsUpdate;
    constructor(config: DiversityConfig);
    /**
     * Register an agent with their initial perspective
     */
    registerAgent(agentId: string, initialProfile?: PerspectiveProfile): void;
    /**
     * Record a decision made by an agent
     */
    recordDecision(agentId: string, decision: string, perspective: string, agreedWithMajority: boolean, evidenceProvided: boolean, challengedAssumptions: boolean): void;
    /**
     * Get current diversity metrics
     */
    getDiversityMetrics(): DiversityMetrics;
    /**
     * Check if a team meets diversity requirements
     */
    checkDiversityRequirements(agentIds: string[]): {
        meets: boolean;
        missing: string[];
        score: number;
    };
    /**
     * Rotate agent perspective to maintain diversity
     */
    rotatePerspective(agentId: string): PerspectiveProfile;
    /**
     * Get agents with specific perspective
     */
    getAgentsByPerspective(profile: PerspectiveProfile): string[];
    /**
     * Calculate diversity score between two agents
     */
    calculatePerspectiveDifference(agentId1: string, agentId2: string): number;
    /**
     * Get recommendation for improving diversity
     */
    getDiversityRecommendations(currentAgentIds: string[]): string[];
    private assignRandomPerspective;
    private calculatePerspectiveScores;
    private calculateDiversityMetrics;
    private getRecentHistory;
    private getPerspectiveDistribution;
    private findUnderrepresentedPerspectives;
    private shouldRotatePerspective;
    private calculateConsensusSpeed;
    private invalidateMetricsCache;
    private isMetricsCacheStale;
}
//# sourceMappingURL=diversity-tracker.d.ts.map