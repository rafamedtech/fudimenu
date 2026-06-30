import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SectionHeading } from '@/components/ui/section-heading';

describe('SectionHeading', () => {
  it('renders a semantic heading followed by supporting copy', () => {
    const html = renderToStaticMarkup(
      <SectionHeading
        as="h3"
        id="identity"
        title="Identidad del menú"
        description="Ajusta cómo se ve y se comparte tu restaurante."
        meta={<span>PNG</span>}
      />,
    );

    expect(html).toContain('<h3 id="identity"');
    expect(html).toContain('>Identidad del menú</h3>');
    expect(html).toContain('>Ajusta cómo se ve y se comparte tu restaurante.</p>');
    expect(html.indexOf('Identidad del menú')).toBeLessThan(
      html.indexOf('Ajusta cómo se ve y se comparte tu restaurante.'),
    );
    expect(html).toContain('>PNG</span>');
  });
});
