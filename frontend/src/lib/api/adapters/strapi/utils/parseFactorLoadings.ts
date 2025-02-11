import type { DPDataType } from '$lib/api/base/dataTypes';
import type { StrapiFactorLoadingData } from '../strapiData.type';

export function parseFactorLoadings(data: StrapiFactorLoadingData): DPDataType['factorLoadings'] {
  if (!data?.attributes) {
    console.warn('No factor loading data or attributes found');
    return null;
  }

  const { results, metadata: originalMetadata } = data.attributes;
  if (!results) {
    console.warn('No results found in factor loading data');
    return null;
  }

  const metadata = originalMetadata || {
    timestamp: new Date().toISOString(),
    numberOfQuestions: 0,
    numberOfResponses: 0,
    converged: false
  };

  return {
    id: String(data.id),
    election: String(data.id),
    questionFactorLoadings: results.questionFactorLoadings.map(loading => ({
      questionId: String(loading.questionId),
      factors: loading.factors
    })),
    explainedVariancePerFactor: results.explainedVariancePerFactor,
    totalExplainedVariance: results.totalExplainedVariance,
    metadata: {
      timestamp: metadata.timestamp,
      numberOfQuestions: metadata.numberOfQuestions,
      numberOfResponses: metadata.numberOfResponses,
      converged: metadata.converged
    }
  };
}
