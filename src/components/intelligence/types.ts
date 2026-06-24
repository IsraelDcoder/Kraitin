export interface CompetitorData {
  name: string;
  revenue: string;
  downloads: string;
  growth: string;
  pricing: string;
  strength?: number;
}

export interface PainPoint {
  text: string;
  severity: number;
  source?: string;
}

export interface LovedFeature {
  text: string;
  score: number;
}

export interface MarketGap {
  title: string;
  gapScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  impact: 'High' | 'Medium' | 'Low';
}

export interface MonetizationModel {
  name: string;
  stars: number;
  score: number;
}

export interface GrowthChannel {
  name: string;
  potential: number;
  rec?: string;
}

export interface MetricCard {
  label: string;
  value: string;
  accent?: string;
}

export interface FounderRec {
  verdict: 'YES' | 'MAYBE' | 'NO';
  confidence: number;
  buildTime: string;
  risk: 'Low' | 'Medium' | 'High';
  potential: 'Low' | 'Medium' | 'High' | 'Very High';
  reasoning: string;
}

export interface IntelligenceData {
  title: string;
  opportunityScore: number;
  revenuePotential: string;
  marketDemand: number;
  competition: string;
  difficulty: number;
  recommendation: string;
  metrics: MetricCard[];
  competitors: CompetitorData[];
  painPoints: PainPoint[];
  lovedFeatures: LovedFeature[];
  marketGaps: MarketGap[];
  monetization: MonetizationModel[];
  growthChannels: GrowthChannel[];
  founderRec: FounderRec;
  aiAnalysis: string;
}
