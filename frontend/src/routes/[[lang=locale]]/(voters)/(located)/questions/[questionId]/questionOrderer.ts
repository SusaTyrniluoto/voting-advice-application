import type { AnyQuestionVariant, FactorLoading } from '@openvaa/data';

/**
 * QuestionOrderer - Orders questions by information gain based on factor loadings
 */
export class QuestionOrderer {
  private questions: Array<AnyQuestionVariant>;
  private factorLoadings: Array<Array<number>>;
  private questionMap: Map<string, number>;

  /**
   * Create a QuestionOrderer
   * @param questions - Array of questions to order
   * @param factorLoadingData - Factor loadings from the backend
   */
  constructor(questions: Array<AnyQuestionVariant>, factorLoadingData: FactorLoading) {
    this.questions = questions;

    // Create a map of question IDs to their indices
    this.questionMap = new Map();
    questions.forEach((q, index) => {
      this.questionMap.set(q.id, index);
    });

    // Convert the backend format to our internal 2D array format
    this.factorLoadings = this.convertFactorLoadings(factorLoadingData);
  }

  /**
   * Convert backend factor loading format to internal 2D array
   */
  private convertFactorLoadings(factorLoadingData: FactorLoading): Array<Array<number>> {
    const factorCount = factorLoadingData.explainedVariancePerFactor.length;
    const loadings = Array(this.questions.length)
      .fill(0)
      .map(() => Array(factorCount).fill(0));

    // Map loadings from backend format to our internal format
    factorLoadingData.questionFactorLoadings.forEach(loading => {
      const questionIndex = this.questionMap.get(loading.questionId);
      if (questionIndex !== undefined) {
        loadings[questionIndex] = loading.factors;
      }
    });

    return loadings;
  }

  /**
   * Get next questions with highest information gain
   * @param answeredIds - IDs of questions already answered
   * @param count - Number of questions to return
   * @returns Array of questions with highest information gain
   */
  public getNextQuestions(answeredIds: Array<string>, count: number): Array<AnyQuestionVariant> {
    // Filter questions that haven't been answered yet
    const unansweredQuestions = this.questions.filter((q) => !answeredIds.includes(q.id));

    if (unansweredQuestions.length === 0) return [];

    // Calculate information gain for each question
    const questionsWithGain = unansweredQuestions.map((q) => ({
      question: q,
      gain: this.calculateInformationGain(q.id, answeredIds)
    }));

    // Sort by information gain (highest first) and return top count
    return questionsWithGain
      .sort((a, b) => b.gain - a.gain)
      .slice(0, count)
      .map((item) => item.question);
  }

  /**
   * Calculate information gain for a question
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @returns Information gain value
   */
  calculateInformationGain(questionId: string, answeredIds: Array<string>): number {
    // Get direct information from residual entropy
    const residualEntropy = this.calculateResidualEntropy(questionId, answeredIds);
    let infoValue = residualEntropy;

    // Calculate indirect information gain
    const questionIdx = this.questionMap.get(questionId);
    if (questionIdx === undefined) {
      console.error(`Question ID ${questionId} not found in map`);
      return 0;
    }

    let indirectGain = 0.0;

    // For each factor
    for (let factorIdx = 0; factorIdx < this.factorLoadings[0].length; factorIdx++) {
      // Get this question's loading on this factor (equivalent to factor_weight)
      const factorWeight = this.factorLoadings[questionIdx][factorIdx];

      // If loading is insignificant, skip
      if (Math.abs(factorWeight) < 0.01) continue;

      // For each other question
      for (const otherQuestion of this.questions) {
        const otherQuestionId = otherQuestion.id;
        const otherQuestionIdx = this.questionMap.get(otherQuestionId);

        // Skip if: same question, already answered, or index not found
        if (otherQuestionId === questionId ||
            answeredIds.includes(otherQuestionId) ||
            otherQuestionIdx === undefined) {
          continue;
        }

        // Get other question's loading on this factor (equivalent to other_weight)
        const otherWeight = this.factorLoadings[otherQuestionIdx][factorIdx];

        // If loading is insignificant, skip
        if (Math.abs(otherWeight) < 0.01) continue;

        // Calculate contribution using the same formula
        const contribution = factorWeight * otherWeight *
                            this.calculateResidualEntropy(otherQuestionId, answeredIds);
        indirectGain += contribution;
      }
    }

    // Add indirect gain to total info value
    infoValue += indirectGain;

    return infoValue;
  }

  /**
   * Calculate residual entropy (information potential) for a question
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @returns Entropy value
   */
  calculateResidualEntropy(questionId: string, answeredIds: Array<string>): number {
    // Early return if no questions have been answered
    if (answeredIds.length === 0) {
      return 1.0;
    }

    // Get the index for this question
    const questionIdx = this.questionMap.get(questionId);
    if (questionIdx === undefined) {
      console.error(`Question ID ${questionId} not found in map`);
      return 0;
    }

    // Get factor loadings for this question across all factors
    const factorLoadings = this.factorLoadings[questionIdx];
    let explainedVariance = 0.0;

    // For each factor, calculate its contribution to explained variance
    for (let factorIdx = 0; factorIdx < factorLoadings.length; factorIdx++) {
      const loading = factorLoadings[factorIdx];

      // Find maximum loading on this factor from answered questions
      // This is equivalent to Python's: max([abs(self.fa.components_[i, q]) for q in answered_questions], default=0)
      let factorDetermination = 0;
      for (const answeredId of answeredIds) {
        const answeredIdx = this.questionMap.get(answeredId);
        if (answeredIdx !== undefined) {
          const absLoading = Math.abs(this.factorLoadings[answeredIdx][factorIdx]);
          if (absLoading > factorDetermination) {
            factorDetermination = absLoading;
          }
        }
      }

      // Add to explained variance using same formula as Python: loading**2 * (1 - factor_determination)
      explainedVariance += loading * loading * (1 - factorDetermination);
    }

    // Calculate residual variance with same minimum as Python (1e-10)
    const residualVariance = Math.max(1e-10, 1 - explainedVariance);

    // Get number of categories for this question
    const question = this.questions.find(q => q.id === questionId);
    const numCategories = (question && 'choices' in question) ? question.choices.length : 5;

    // Base entropy from continuous approximation
    const continuousEntropy = 0.5 * Math.log(2 * Math.PI * Math.E * residualVariance);

    // Correction for discretization
    const width = Math.sqrt(residualVariance) / numCategories;
    const discretizationLoss = -Math.log(width);

    // Additional correction for ordinal nature
    const ordinalCorrection = Math.log(numCategories);

    // Final entropy calculation (same as Python)
    return Math.max(0, continuousEntropy - discretizationLoss + ordinalCorrection);
  }
}
