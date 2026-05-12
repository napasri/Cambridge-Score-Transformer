export enum ScoringTier {
  EXCELLENT = 'excellent', // 90-100 -> 2
  VERY_GOOD = 'very_good',   // 80-89 -> 1.5
  GOOD = 'good',            // 70-79 -> 1
  FAIR = 'fair',            // 60-69 -> 0.5
  POOR = 'poor'             // 0-59 -> 0
}

export interface RawScoreResult {
  studentName: string;
  studentId: string | null;
  email: string;
  assignmentName: string;
  percentageScore: number;
  lateStatus?: string;
  completionStatus?: string;
  className?: string;
}

export interface TransformedScore extends RawScoreResult {
  originalPercentage: number;
  transformedScore: number;
}

export interface StudentSummary {
  studentName: string;
  studentId: string;
  email: string;
  assignments: {
    [assignmentName: string]: TransformedScore;
  };
  totalPoints: number;
}
