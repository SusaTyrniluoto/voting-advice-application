<!--
@component
Display the question's expandable information content.

### Properties

- `title`: The title for the info, usually the question text.
- `info`: The info content to show as a plain or HTML string.
- `infoSections`: An array of objects with `title` and `content` properties to show as expandable sections.
- `onCollapse`: A callback triggered when the info content is collapsed. Mostly used for tracking.
- `onExpand`: A callback triggered when the info content is expanded.  Mostly used for tracking.
- Any valid properties of a `<div>` element

### Usage

```tsx
<QuestionExtendedInfo
  info={question.info}
  infoSections={customData.infoSections} />
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Expander } from '../expander';
  import type { QuestionInfoProps } from './QuestionExtendedInfo.type';

  type $$Props = QuestionInfoProps;

  export let title: $$Props['title'];
  export let info: $$Props['info'];
  export let infoSections: $$Props['infoSections'] = [];
</script>

<div {...concatClass($$restProps, 'flex flex-col gap-lg justify-stretch')}>
  <h2 class="text-center">{title}</h2>
  {@html sanitizeHtml(info)}
  {#if infoSections?.length}
    <div class="mt-16">
      {#each infoSections as { title, content }}
        {#if title}
          <Expander {title} titleClass="flex justify-between font-bold" contentClass="!text-left">
            {@html sanitizeHtml(content)}
          </Expander>
        {/if}
      {/each}
    </div>
  {/if}
</div>
