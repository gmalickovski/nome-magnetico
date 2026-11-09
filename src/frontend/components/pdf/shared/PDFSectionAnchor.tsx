import type { ComponentProps } from 'react';
import { View } from '@react-pdf/renderer';
import type { Bookmark } from '@react-pdf/types';

/**
 * Âncora de navegação no início lógico de uma seção.
 * IDs em <Page> que quebram em várias folhas fazem o /GoTo apontar para a última página;
 * este View fixo no topo da seção mantém destino e bookmark alinhados.
 */
export function PDFSectionAnchor({
  id,
  bookmark,
}: {
  id: string;
  bookmark: Bookmark;
}) {
  // O runtime suporta bookmark em View; ViewProps desta versão omite a prop.
  const props: ComponentProps<typeof View> & { bookmark: Bookmark } = {
    id,
    bookmark,
    wrap: false,
    style: { height: 1, opacity: 0 },
  };
  return <View {...props} />;
}
