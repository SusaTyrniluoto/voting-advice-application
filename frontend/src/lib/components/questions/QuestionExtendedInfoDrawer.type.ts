import type { AnyQuestionVariant } from '@openvaa/data';
import type { DrawerProps } from '../modal/drawer';

export type QuestionExtendedInfoDrawerProps = Omit<DrawerProps, 'title'> & {
  /**
   * The question to extract info from
   */
  question: AnyQuestionVariant;
};
