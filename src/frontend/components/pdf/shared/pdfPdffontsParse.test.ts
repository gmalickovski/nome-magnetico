import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePdffontsEmbColumn, parsePdffontsEmbeddedFontNames } from './pdfPdffontsParse.ts';

describe('pdfPdffontsParse', () => {
  it('lê coluna emb (não type) no formato Poppler', () => {
    const line =
      'YRTREW+Inter-Regular                CID TrueType      yes yes yes      5  0';
    const parsed = parsePdffontsEmbColumn(line);
    assert.ok(parsed);
    assert.equal(parsed!.embedded, true);
    assert.match(parsed!.name, /Inter-Regular/);
  });

  it('marca Helvetica não embutida', () => {
    const line = 'Helvetica                           Type 1           no  no  no       6  0';
    const parsed = parsePdffontsEmbColumn(line);
    assert.ok(parsed);
    assert.equal(parsed!.embedded, false);
  });

  it('agrega apenas fontes emb=yes', () => {
    const stdout = `name                                 type              emb sub uni object ID
------------------------------------ ----------------- --- --- --- ---------
YRTREW+Inter-Regular                CID TrueType      yes yes yes      5  0
Helvetica                           Type 1           no  no  no       6  0
KTOLLP+Cinzel-Bold                  CID TrueType      yes yes yes      4  0
`;
    const names = parsePdffontsEmbeddedFontNames(stdout);
    assert.equal(names.length, 2);
    assert.match(names[0], /Inter-Regular/);
    assert.match(names[1], /Cinzel-Bold/);
  });
});
