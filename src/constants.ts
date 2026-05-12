import { RawScoreResult, TransformedScore } from './types';

export const SCORING_RULES = [
  { min: 90, max: 100, score: 2 },
  { min: 80, max: 89, score: 1.5 },
  { min: 70, max: 79, score: 1 },
  { min: 60, max: 69, score: 0.5 },
  { min: 0, max: 59, score: 0 },
];

export function transformPercentageToScore(percentage: number): number {
  const rounded = Math.round(percentage);
  const rule = SCORING_RULES.find(r => rounded >= r.min && rounded <= r.max);
  return rule ? rule.score : 0;
}

export function processRawData(data: RawScoreResult[]): TransformedScore[] {
  return data.map(item => ({
    ...item,
    originalPercentage: item.percentageScore,
    transformedScore: transformPercentageToScore(item.percentageScore)
  }));
}
