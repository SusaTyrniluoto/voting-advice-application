import type { ButtonProps } from '$lib/components/button';
import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';

export type QuestionExtendedInfoButtonProps = Partial<ButtonProps> & QuestionExtendedInfoDrawerProps;
