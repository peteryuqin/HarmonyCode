"use strict";
/**
 * Perspective Analyzer for Anti-Echo-Chamber System
 * Analyzes statements and decisions for perspective diversity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerspectiveAnalyzer = void 0;
const types_1 = require("./types");
class PerspectiveAnalyzer {
    constructor() {
        this.recentStatements = new Map();
        this.phraseFrequency = new Map();
        this.initializePatterns();
    }
    /**
     * Analyze a statement to detect perspective and echo patterns
     */
    analyzeStatement(agentId, statement, context) {
        // Extract features from statement
        const features = this.extractFeatures(statement);
        // Detect perspective based on features
        const detectedPerspective = this.detectPerspective(features);
        // Check for echo patterns
        const echoPatterns = this.detectEchoPatterns(statement, agentId, context);
        // Calculate diversity contribution
        const diversityContribution = this.calculateDiversityContribution(features, echoPatterns);
        // Analyze evidence quality if present
        const evidenceQuality = this.analyzeEvidenceQuality(statement);
        // Generate recommendations
        const recommendations = this.generateRecommendations(features, echoPatterns, diversityContribution);
        // Store statement for future echo detection
        this.recordStatement(agentId, statement);
        return {
            detectedPerspective: detectedPerspective.profile,
            confidence: detectedPerspective.confidence,
            isEchoing: echoPatterns.length > 0 && echoPatterns.some(p => p.severity !== 'LOW'),
            echoPatterns,
            diversityContribution,
            evidenceQuality,
            recommendations
        };
    }
    /**
     * Compare two perspectives to measure difference
     */
    comparePerspectives(perspective1, perspective2) {
        const scores1 = this.getPerspectiveScores(perspective1);
        const scores2 = this.getPerspectiveScores(perspective2);
        const differences = Object.keys(scores1).map(key => {
            const k = key;
            return Math.abs(scores1[k] - scores2[k]);
        });
        return differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    }
    /**
     * Analyze evidence quality in a statement
     */
    analyzeEvidenceQuality(statement) {
        let score = 0;
        const lower = statement.toLowerCase();
        // Check for evidence indicators
        const evidenceIndicators = [
            { pattern: /stud(y|ies) show/i, weight: 0.2 },
            { pattern: /data (indicate|show|suggest)/i, weight: 0.2 },
            { pattern: /research (found|indicates)/i, weight: 0.2 },
            { pattern: /\d+%/g, weight: 0.1 },
            { pattern: /benchmark|metric|measurement/i, weight: 0.15 },
            { pattern: /case study|example/i, weight: 0.1 },
            { pattern: /source:|according to/i, weight: 0.1 }
        ];
        evidenceIndicators.forEach(indicator => {
            if (indicator.pattern.test(lower)) {
                score += indicator.weight;
            }
        });
        // Penalty for vague claims
        const vagueIndicators = [
            /everyone knows/i,
            /obviously/i,
            /clearly/i,
            /it's well known/i,
            /common sense/i
        ];
        vagueIndicators.forEach(pattern => {
            if (pattern.test(lower)) {
                score -= 0.1;
            }
        });
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Extract linguistic features from statement
     */
    extractFeatures(statement) {
        const lower = statement.toLowerCase();
        const words = lower.split(/\s+/);
        // Sentiment analysis (simplified)
        const positiveWords = ['great', 'excellent', 'perfect', 'best', 'optimal'];
        const negativeWords = ['bad', 'poor', 'worst', 'problematic', 'issue'];
        const positiveCount = words.filter(w => positiveWords.includes(w)).length;
        const negativeCount = words.filter(w => negativeWords.includes(w)).length;
        const sentiment = (positiveCount - negativeCount) / Math.max(words.length * 0.1, 1);
        // Certainty detection
        const certaintyWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'must'];
        const uncertaintyWords = ['maybe', 'perhaps', 'might', 'could', 'possibly'];
        const certaintyCount = words.filter(w => certaintyWords.includes(w)).length;
        const uncertaintyCount = words.filter(w => uncertaintyWords.includes(w)).length;
        const certainty = (certaintyCount - uncertaintyCount + 1) / 2;
        // Innovation vs conservative
        const innovativeWords = ['new', 'innovative', 'novel', 'creative', 'experimental'];
        const conservativeWords = ['traditional', 'proven', 'established', 'standard'];
        const innovationScore = words.filter(w => innovativeWords.includes(w)).length;
        const conservativeScore = words.filter(w => conservativeWords.includes(w)).length;
        const innovation = innovationScore / (innovationScore + conservativeScore + 1);
        // Risk awareness
        const riskWords = ['risk', 'danger', 'concern', 'issue', 'problem', 'challenge'];
        const riskAwareness = words.filter(w => riskWords.includes(w)).length / words.length;
        // Evidence-based score
        const evidenceWords = ['data', 'study', 'research', 'evidence', 'metric', 'measure'];
        const evidenceBased = words.filter(w => evidenceWords.includes(w)).length / words.length;
        // Agreement/disagreement signals
        const agreementSignals = this.findPatternMatches(statement, this.agreementPatterns);
        const disagreementSignals = this.findPatternMatches(statement, this.disagreementPatterns);
        // Extract keywords (non-common words)
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about']);
        const keywords = words.filter(w => !commonWords.has(w) && w.length > 3);
        return {
            sentiment: Math.max(-1, Math.min(1, sentiment)),
            certainty: Math.max(0, Math.min(1, certainty)),
            innovation: Math.max(0, Math.min(1, innovation)),
            riskAwareness: Math.max(0, Math.min(1, riskAwareness)),
            evidenceBased: Math.max(0, Math.min(1, evidenceBased)),
            agreementSignals,
            disagreementSignals,
            keywords
        };
    }
    /**
     * Detect perspective based on features
     */
    detectPerspective(features) {
        const scores = {};
        // Score each perspective based on features
        if (features.sentiment > 0.5 && features.innovation > 0.5) {
            scores[types_1.PerspectiveProfile.OPTIMIST] = 0.8;
            scores[types_1.PerspectiveProfile.INNOVATOR] = 0.7;
        }
        if (features.certainty < 0.3 && features.evidenceBased > 0.5) {
            scores[types_1.PerspectiveProfile.SKEPTIC] = 0.8;
            scores[types_1.PerspectiveProfile.ANALYTICAL] = 0.7;
        }
        if (features.innovation < 0.3 && features.riskAwareness > 0.5) {
            scores[types_1.PerspectiveProfile.CONSERVATIVE] = 0.8;
        }
        if (Math.abs(features.sentiment) < 0.3 && features.evidenceBased > 0.3) {
            scores[types_1.PerspectiveProfile.PRAGMATIST] = 0.7;
        }
        if (features.innovation > 0.7) {
            scores[types_1.PerspectiveProfile.CREATIVE] = 0.6;
        }
        // Find highest scoring perspective
        let bestProfile = types_1.PerspectiveProfile.PRAGMATIST;
        let bestScore = 0;
        Object.entries(scores).forEach(([profile, score]) => {
            if (score > bestScore) {
                bestScore = score;
                bestProfile = profile;
            }
        });
        return {
            profile: bestProfile,
            confidence: bestScore || 0.5
        };
    }
    /**
     * Detect echo chamber patterns
     */
    detectEchoPatterns(statement, agentId, context) {
        const patterns = [];
        // Check for phrase repetition
        const phraseRepetition = this.detectPhraseRepetition(statement);
        if (phraseRepetition) {
            patterns.push(phraseRepetition);
        }
        // Check for agreement cascade
        if (this.detectAgreementCascade(statement, context)) {
            patterns.push({
                type: 'AGREEMENT_CASCADE',
                severity: 'HIGH',
                description: 'Sequential agreement without new insights',
                examples: context?.slice(-3) || []
            });
        }
        // Check for groupthink indicators
        const groupthink = this.detectGroupthink(statement, context);
        if (groupthink) {
            patterns.push(groupthink);
        }
        // Check for bandwagon effect
        if (this.detectBandwagon(statement)) {
            patterns.push({
                type: 'BANDWAGON',
                severity: 'MEDIUM',
                description: 'Following majority opinion without critical evaluation',
                examples: [statement]
            });
        }
        return patterns;
    }
    /**
     * Detect repeated phrases across agents
     */
    detectPhraseRepetition(statement) {
        const phrases = this.extractPhrases(statement);
        let repeatedPhrases = [];
        phrases.forEach(phrase => {
            const count = this.phraseFrequency.get(phrase) || 0;
            this.phraseFrequency.set(phrase, count + 1);
            if (count > 2) {
                repeatedPhrases.push(phrase);
            }
        });
        if (repeatedPhrases.length > 0) {
            return {
                type: 'PHRASE_REPETITION',
                severity: repeatedPhrases.length > 2 ? 'HIGH' : 'MEDIUM',
                description: 'Multiple agents using identical phrases',
                examples: repeatedPhrases
            };
        }
        return null;
    }
    /**
     * Detect agreement cascade pattern
     */
    detectAgreementCascade(statement, context) {
        if (!context || context.length < 3)
            return false;
        const recentAgreements = context.filter(s => this.agreementPatterns.some(p => p.test(s))).length;
        const hasAgreement = this.agreementPatterns.some(p => p.test(statement));
        return hasAgreement && recentAgreements >= 2;
    }
    /**
     * Detect groupthink indicators
     */
    detectGroupthink(statement, context) {
        const groupthinkPhrases = [
            /we all agree/i,
            /consensus is clear/i,
            /everyone thinks/i,
            /no need to discuss further/i,
            /the obvious choice/i
        ];
        const matches = groupthinkPhrases.filter(p => p.test(statement));
        if (matches.length > 0) {
            return {
                type: 'GROUPTHINK',
                severity: 'HIGH',
                description: 'Premature consensus without exploring alternatives',
                examples: [statement]
            };
        }
        return null;
    }
    /**
     * Detect bandwagon effect
     */
    detectBandwagon(statement) {
        const bandwagonPhrases = [
            /since everyone/i,
            /like others said/i,
            /following the majority/i,
            /as mentioned before/i,
            /adding to what.*said/i
        ];
        return bandwagonPhrases.some(p => p.test(statement));
    }
    /**
     * Calculate how much this statement contributes to diversity
     */
    calculateDiversityContribution(features, echoPatterns) {
        let score = 0.5; // Baseline
        // Boost for disagreement
        if (features.disagreementSignals.length > 0) {
            score += 0.3;
        }
        // Boost for evidence
        score += features.evidenceBased * 0.2;
        // Penalty for echo patterns
        echoPatterns.forEach(pattern => {
            if (pattern.severity === 'HIGH')
                score -= 0.3;
            else if (pattern.severity === 'MEDIUM')
                score -= 0.2;
            else
                score -= 0.1;
        });
        // Boost for unique keywords
        const uniqueKeywords = features.keywords.filter(k => (this.phraseFrequency.get(k) || 0) < 2);
        score += Math.min(0.2, uniqueKeywords.length * 0.05);
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Generate recommendations for improving diversity
     */
    generateRecommendations(features, echoPatterns, diversityContribution) {
        const recommendations = [];
        if (echoPatterns.some(p => p.type === 'AGREEMENT_CASCADE')) {
            recommendations.push('Provide a contrasting viewpoint or play devil\'s advocate');
        }
        if (features.evidenceBased < 0.3) {
            recommendations.push('Support claims with data or case studies');
        }
        if (features.innovation < 0.3 && features.disagreementSignals.length === 0) {
            recommendations.push('Consider proposing an alternative approach');
        }
        if (diversityContribution < 0.3) {
            recommendations.push('Challenge an assumption or identify potential risks');
        }
        if (features.certainty > 0.8) {
            recommendations.push('Acknowledge uncertainties or edge cases');
        }
        return recommendations;
    }
    // Helper methods
    initializePatterns() {
        this.agreementPatterns = [
            /i agree/i,
            /exactly/i,
            /that's right/i,
            /absolutely/i,
            /correct/i,
            /precisely/i,
            /well said/i,
            /couldn't agree more/i
        ];
        this.disagreementPatterns = [
            /i disagree/i,
            /however/i,
            /on the other hand/i,
            /alternatively/i,
            /but/i,
            /actually/i,
            /that's not quite/i,
            /i would argue/i
        ];
    }
    findPatternMatches(text, patterns) {
        const matches = [];
        patterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                matches.push(match[0]);
            }
        });
        return matches;
    }
    extractPhrases(statement) {
        const words = statement.toLowerCase().split(/\s+/);
        const phrases = [];
        // Extract 2-3 word phrases
        for (let i = 0; i < words.length - 1; i++) {
            phrases.push(words.slice(i, i + 2).join(' '));
            if (i < words.length - 2) {
                phrases.push(words.slice(i, i + 3).join(' '));
            }
        }
        return phrases;
    }
    recordStatement(agentId, statement) {
        const agentStatements = this.recentStatements.get(agentId) || [];
        agentStatements.push(statement);
        // Keep only recent statements
        if (agentStatements.length > 20) {
            agentStatements.shift();
        }
        this.recentStatements.set(agentId, agentStatements);
    }
    getPerspectiveScores(profile) {
        // This would normally come from a configuration or the diversity tracker
        // For now, returning characteristic scores for each profile
        const scores = {
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
        return scores[profile];
    }
}
exports.PerspectiveAnalyzer = PerspectiveAnalyzer;
//# sourceMappingURL=perspective-analyzer.js.map