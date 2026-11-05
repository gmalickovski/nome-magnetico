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
  return (
    <View
      id={id}
      bookmark={bookmark}
      wrap={false}
      style={{ height: 1, opacity: 0 }}
    />
  );
}
