/**
 * Diversity Enforcer for Anti-Echo-Chamber System
 * Actively enforces intellectual diversity and prevents groupthink
 */
import { DiversityTracker } from './diversity-tracker';
import { PerspectiveAnalyzer } from './perspective-analyzer';
import { DiversityConfig, DiversityRequirement, DiversityIntervention, PerspectiveProfile, DiversityMetrics } from './types';
export interface EnforcementResult {
    allowed: boolean;
    intervention?: DiversityIntervention;
    modifiedContent?: string;
    requiredActions?: string[];
    score: number;
}
export interface EnforcementContext {
    agentId: string;
    content: string;
    messageType: 'statement' | 'decision' | 'vote';
    targetClaim?: string;
    evidence?: any[];
    otherAgents: string[];
}
export declare class DiversityEnforcer {
    private tracker;
    private analyzer;
    private config;
    private requirements;
    private interventionHistory;
    private enforcementMetrics;
    constructor(config: DiversityConfig, requirements: DiversityRequirement, tracker?: DiversityTracker, analyzer?: PerspectiveAnalyzer);
    /**
     * Check if a contribution meets diversity requirements
     */
    enforceContribution(context: EnforcementContext): Promise<EnforcementResult>;
    /**
     * Force perspective rotation for an agent
     */
    forcePerspectiveRotation(agentId: string): PerspectiveProfile;
    /**
     * Get enforcement recommendations for a team
     */
    getTeamRecommendations(agentIds: string[]): string[];
    /**
     * Create intervention for a specific situation
     */
    createIntervention(type: DiversityIntervention['type'], agentId: string, reason: string): DiversityIntervention;
    private checkEchoChamber;
    private checkDisagreementQuota;
    private checkEvidenceRequirement;
    private checkPerspectiveDiversity;
    private checkConsensusSpeed;
    private selectMostSevereIntervention;
    private modifyContent;
    private generateRequiredActions;
    private getRecentContext;
    private recordIntervention;
    /**
     * Get enforcement metrics
     */
    getMetrics(): {
        diversityMetrics: DiversityMetrics;
        interventionRate: number;
        totalChecks: number;
        interventions: number;
        perspectiveRotations: number;
        forcedDisagreements: number;
        evidenceRequests: number;
    };
}
//# sourceMappingURL=diversity-enforcer.d.ts.map