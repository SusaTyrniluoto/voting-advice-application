import type { DataObjectData, Id } from '../../internal';

export interface FactorLoadingData extends DataObjectData {
  // From DataObjectData
  // - id: Id
  // - color?: Colors | null
  // - image?: Image | null
  // - name?: string
  // - shortName?: string
  // - info?: string
  // - order?: number
  // - customData?: object
  // - subtype?: string
  // - isGenerated?: boolean

  election: string;
  questionFactorLoadings: Array<QuestionFactorLoading>;
  explainedVariancePerFactor: Array<number>;
  totalExplainedVariance: number;
  metadata: FactorLoadingMetadata;
}

export interface QuestionFactorLoading {
  questionId: Id;
  factors: Array<number>;
}

export interface FactorLoadingMetadata {
  timestamp: string;
  numberOfQuestions: number;
  numberOfResponses: number;
  converged: boolean;
}
