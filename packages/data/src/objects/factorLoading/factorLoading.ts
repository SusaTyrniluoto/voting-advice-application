import {
  type AnyQuestionVariant,
  type DataAccessor,
  DataObject,
  type FactorLoadingData,
  type Id,
  type QuestionFactorLoading
} from '../../internal';

export class FactorLoading
  extends DataObject<FactorLoadingData>
  implements DataAccessor<FactorLoadingData>
{
  //////////////////////////////////////////////////////////////////////////////
  // DataAccessor implementation
  //////////////////////////////////////////////////////////////////////////////

  get metadata(): FactorLoadingData['metadata'] {
    return this.data.metadata;
  }

  get questionFactorLoadings(): FactorLoadingData['questionFactorLoadings'] {
    return this.data.questionFactorLoadings;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

  get election(): string {
    return this.data.election;
  }

  get timestamp(): Date {
    return new Date(this.data.metadata.timestamp);
  }

  get numberOfQuestions(): number {
    return this.data.metadata.numberOfQuestions;
  }

  get numberOfResponses(): number {
    return this.data.metadata.numberOfResponses;
  }

  get converged(): boolean {
    return this.data.metadata.converged;
  }

  get explainedVariancePerFactor(): Array<number> {
    return this.data.explainedVariancePerFactor;
  }

  get totalExplainedVariance(): number {
    return this.data.totalExplainedVariance;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Methods
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get factor loadings for a specific question
   */
  getFactorsForQuestion(questionId: Id): Array<number> | undefined {
    return this.data.questionFactorLoadings.find(
      (loading: QuestionFactorLoading) => loading.questionId === questionId
    )?.factors;
  }

  /**
   * Get questions ordered by their loading on a specific factor
   */
  getQuestionsOrderedByFactor(factorIndex: number): Array<AnyQuestionVariant> {
    return this.data.questionFactorLoadings
      .slice()
      .sort(
        (a, b) =>
          Math.abs(b.factors[factorIndex]) - Math.abs(a.factors[factorIndex])
      )
      .map((loading: QuestionFactorLoading) =>
        this.root.getQuestion(loading.questionId)
      );
  }

  /**
   * Get the highest loading questions for a factor
   */
  getTopQuestionsForFactor(
    factorIndex: number,
    count: number = 5
  ): Array<AnyQuestionVariant> {
    return this.getQuestionsOrderedByFactor(factorIndex).slice(0, count);
  }
}
