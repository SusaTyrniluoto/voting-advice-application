<!--
@component
A button that will display the question's extended information content in a `Drawer`.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Button>` component

### Usage

```tsx
<QuestionExtendedInfoButton {question} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { QuestionExtendedInfoDrawer } from '.';
  import type { QuestionExtendedInfoButtonProps } from './QuestionExtendedInfoButton.type';

  type $$Props = QuestionExtendedInfoButtonProps;

  export let question: $$Props['question'];

  const { t } = getComponentContext();

  let showDrawer = false;
</script>

{#if showDrawer}
  <QuestionExtendedInfoDrawer {question} onClose={() => (showDrawer = false)} />
{/if}

<Button
  text={$t('components.questionExtendedInfo.title')}
  icon="info"
  iconPos="left"
  on:click={() => (showDrawer = true)}
  {...$$restProps} />
