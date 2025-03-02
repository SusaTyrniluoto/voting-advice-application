import type { QuestionInfoSection } from '@openvaa/app-shared';
import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionInfoProps = SvelteHTMLElements['div'] & {
  /**
   * The title for the info, usually the question text.
   */
  title: string;
  /**
   * The info content to show as a plain or HTML string.
   */
  info: string;
  /**
   * Additional expandable info sections shown as plain or HTML strings.
   */
  infoSections?: Array<QuestionInfoSection>;
};
