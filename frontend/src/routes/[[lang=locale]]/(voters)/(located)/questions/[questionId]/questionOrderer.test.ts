import { describe, expect, it } from 'vitest';
import { QuestionOrderer } from './questionOrderer';
import type { AnyQuestionVariant, FactorLoading } from '@openvaa/data';

/**
 * Create mock factor loading data for testing
 * @param questionCount - Number of questions
 * @returns Mock factor loading data
 */
function getMockFactorData(questionCount: number): FactorLoading {
  // Create mock question IDs and loadings
  const questionFactorLoadings = Array(questionCount)
    .fill(0)
    .map((_, idx) => ({
      questionId: `q${idx + 1}`,
      factors: [Math.random() * 0.9, Math.random() * 0.9]
    }));
  
  return {
    id: 'mock',
    election: 1,  // Move election to root level
    results: {   // Group these properties under 'results'
      questionFactorLoadings,
      explainedVariancePerFactor: [60, 20],
      totalExplainedVariance: 80,
      candidateOrder: []
    },
    metadata: {
      timestamp: new Date().toISOString(),  // Convert Date to ISO string
      numberOfQuestions: questionCount,
      numberOfResponses: 100,
      converged: true
    }
  } as unknown as FactorLoading;
}


// Helper to create a mock question
function createMockQuestion(id: string, categoryId: string): AnyQuestionVariant {
  return {
    id,
    type: 'singleChoiceOrdinal',
    text: `Question ${id}`,
    category: { id: categoryId, name: `Category ${categoryId}` },
    choices: [
      { id: `${id}_1`, text: 'Option 1', value: 1 },
      { id: `${id}_2`, text: 'Option 2', value: 2 },
      { id: `${id}_3`, text: 'Option 3', value: 3 },
      { id: `${id}_4`, text: 'Option 4', value: 4 },
      { id: `${id}_5`, text: 'Option 5', value: 5 }
    ],
    ensureValue: (val: unknown) => val as string
  } as unknown as AnyQuestionVariant;
}

// Helper to create mock factor loading data with specific loadings
function createMockFactorLoadingData(questionIds: Array<string>, loadings: Array<Array<number>>): FactorLoading {
  // Create question factor loadings
  const questionFactorLoadings = questionIds.map((id, idx) => ({
    questionId: id,
    factors: loadings[idx] || [0, 0]
  }));
  
  return {
    id: 'mock-test',
    election: 1,
    results: {
      questionFactorLoadings,
      explainedVariancePerFactor: [60, 20],
      totalExplainedVariance: 80,
      candidateOrder: []
    },
    metadata: {
      timestamp: new Date().toISOString(),
      numberOfQuestions: questionIds.length,
      numberOfResponses: 100,
      converged: true
    }
  } as unknown as FactorLoading;
}

describe('QuestionOrderer', () => {
  it('should return questions ordered by information gain', () => {
    // Create mock questions
    const questions = [
      createMockQuestion('q1', 'cat1'),
      createMockQuestion('q2', 'cat1'),
      createMockQuestion('q3', 'cat2'),
      createMockQuestion('q4', 'cat2'),
      createMockQuestion('q5', 'cat3')
    ];

    // Create mock factor loadings
    // These are designed so q3 has highest information gain, then q5, then q2
    const factorLoadings = [
      [0.2, 0.1], // q1: low loadings
      [0.5, 0.3], // q2: medium loadings
      [0.8, 0.7], // q3: high loadings
      [0.1, 0.1], // q4: very low loadings
      [0.7, 0.5]  // q5: high loadings
    ];

    const questionIds = questions.map(q => q.id);
    const factorLoadingData = createMockFactorLoadingData(questionIds, factorLoadings);
    const orderer = new QuestionOrderer(questions, factorLoadingData);

    // Test ordering with no answered questions
    const nextQuestions = orderer.getNextQuestions([], 3);

    // Check that we got the expected number of questions
    expect(nextQuestions.length).toBe(3);

    // The first returned question should be q3 (highest loadings)
    expect(nextQuestions[0].id).toBe('q3');

    // The second should be q5 (second highest loadings)
    expect(nextQuestions[1].id).toBe('q5');

    // Test that already answered questions don't get returned
    const nextAfterAnswering = orderer.getNextQuestions(['q3', 'q5'], 2);
    expect(nextAfterAnswering.length).toBe(2);
    expect(nextAfterAnswering.map((q) => q.id)).not.toContain('q3');
    expect(nextAfterAnswering.map((q) => q.id)).not.toContain('q5');

    // Test that when all questions are answered, we get an empty array
    const allAnswered = orderer.getNextQuestions(['q1', 'q2', 'q3', 'q4', 'q5'], 2);
    expect(allAnswered.length).toBe(0);
  });

  it('should handle different information contexts based on answered questions', () => {
    // Create mock questions
    const questions = [
      createMockQuestion('q1', 'cat1'),
      createMockQuestion('q2', 'cat1'),
      createMockQuestion('q3', 'cat2'),
      createMockQuestion('q4', 'cat2')
    ];

    // Create factor loadings with meaningful correlations
    // q1 and q2 load heavily on factor 1
    // q3 and q4 load heavily on factor 2
    const factorLoadings = [
      [0.8, 0.1], // q1: high on factor 1
      [0.7, 0.2], // q2: high on factor 1
      [0.2, 0.9], // q3: high on factor 2
      [0.1, 0.8]  // q4: high on factor 2
    ];

    const questionIds = questions.map(q => q.id);
    const factorLoadingData = createMockFactorLoadingData(questionIds, factorLoadings);
    const orderer = new QuestionOrderer(questions, factorLoadingData);

    // With no answers, we should get a mix of questions representing both factors
    const initialNext = orderer.getNextQuestions([], 2);
    expect(initialNext.length).toBe(2);

    // After answering q1 (which loads on factor 1), the next suggested question
    // should ideally be from factor 2 (q3 or q4) for maximum information gain
    const nextAfterQ1 = orderer.getNextQuestions(['q1'], 1);
    expect(nextAfterQ1.length).toBe(1);
    expect(['q3', 'q4'].includes(nextAfterQ1[0].id)).toBeTruthy();

    // After answering both q1 and q3 (representing both factors),
    // the next questions would be less important
    const finalQuestions = orderer.getNextQuestions(['q1', 'q3'], 2);
    expect(finalQuestions.length).toBe(2);
    expect(finalQuestions.map((q) => q.id).sort()).toEqual(['q2', 'q4']);
  });

  it('should use the mock factor data generator correctly', () => {
    const mockFactors = getMockFactorData(5);

    // Verify structure of generated mock data
    expect(mockFactors.results.questionFactorLoadings.length).toBe(5);
    expect(mockFactors.results.questionFactorLoadings[0].factors.length).toBe(2); // 2 factors
    expect(mockFactors.results.explainedVariancePerFactor).toEqual([60, 20]);
    expect(mockFactors.results.totalExplainedVariance).toBe(80);
    expect(mockFactors.metadata.numberOfQuestions).toBe(5);
    expect(mockFactors.metadata.converged).toBe(true);

    // Verify that all loadings are between 0 and 1
    mockFactors.results.questionFactorLoadings.forEach(item => {
      item.factors.forEach(loading => {
        expect(loading).toBeGreaterThanOrEqual(0);
        expect(loading).toBeLessThanOrEqual(1);
      });
    });
  });
});
