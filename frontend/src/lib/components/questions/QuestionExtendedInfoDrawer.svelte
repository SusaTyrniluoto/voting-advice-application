<!--
@component
A `Drawer` that displays the question's extended information.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Drawer>` component

### Usage

```tsx
<QuestionExtendedInfoDrawer {question} onClose={() => console.info('Closed!')}/>
  ```
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { Drawer } from '$lib/components/modal/drawer';
  import { QuestionExtendedInfo } from '$lib/components/questions';
  import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';

  type $$Props = QuestionExtendedInfoDrawerProps;

  export let question: $$Props['question'];

  const customData = getCustomData(question);
</script>

<Drawer title={question.text} {...$$restProps}>
  <QuestionExtendedInfo
    title={question.text}
    info={question.info}
    infoSections={customData?.infoSections}
    class="p-lg" />
</Drawer>
