/**
 * Perspective Analyzer for Anti-Echo-Chamber System
 * Analyzes statements and decisions for perspective diversity
 */
import { PerspectiveProfile } from './types';
export interface AnalysisResult {
    detectedPerspective: PerspectiveProfile;
    confidence: number;
    isEchoing: boolean;
    echoPatterns: EchoPattern[];
    diversityContribution: number;
    evidenceQuality: number;
    recommendations: string[];
}
export interface EchoPattern {
    type: 'PHRASE_REPETITION' | 'AGREEMENT_CASCADE' | 'GROUPTHINK' | 'BANDWAGON';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    examples: string[];
}
export interface StatementFeatures {
    sentiment: number;
    certainty: number;
    innovation: number;
    riskAwareness: number;
    evidenceBased: number;
    agreementSignals: string[];
    disagreementSignals: string[];
    keywords: string[];
}
export declare class PerspectiveAnalyzer {
    private recentStatements;
    private phraseFrequency;
    private agreementPatterns;
    private disagreementPatterns;
    constructor();
    /**
     * Analyze a statement to detect perspective and echo patterns
     */
    analyzeStatement(agentId: string, statement: string, context?: string[]): AnalysisResult;
    /**
     * Compare two perspectives to measure difference
     */
    comparePerspectives(perspective1: PerspectiveProfile, perspective2: PerspectiveProfile): number;
    /**
     * Analyze evidence quality in a statement
     */
    analyzeEvidenceQuality(statement: string): number;
    /**
     * Extract linguistic features from statement
     */
    private extractFeatures;
    /**
     * Detect perspective based on features
     */
    private detectPerspective;
    /**
     * Detect echo chamber patterns
     */
    private detectEchoPatterns;
    /**
     * Detect repeated phrases across agents
     */
    private detectPhraseRepetition;
    /**
     * Detect agreement cascade pattern
     */
    private detectAgreementCascade;
    /**
     * Detect groupthink indicators
     */
    private detectGroupthink;
    /**
     * Detect bandwagon effect
     */
    private detectBandwagon;
    /**
     * Calculate how much this statement contributes to diversity
     */
    private calculateDiversityContribution;
    /**
     * Generate recommendations for improving diversity
     */
    private generateRecommendations;
    private initializePatterns;
    private findPatternMatches;
    private extractPhrases;
    private recordStatement;
    private getPerspectiveScores;
}
//# sourceMappingURL=perspective-analyzer.d.ts.map