import assert from 'assert';
import vscode from 'vscode';
import { showFile } from '../../../editorHelper';
import { range } from '../../../util';
import { getDocUri } from '../../path';

describe('Should do documentSymbol', () => {
  const docUri = getDocUri('documentSymbol/Basic.vue');

  it('shows all documentSymbols for Basic.vue', async () => {
    await testSymbol(docUri, [
      {
        name: '"Basic.vue"',
        kind: 1,
        range: range(0, 0, 21, 0),
        children: [
          {
            name: 'template',
            kind: 7,
            range: range(0, 0, 3, 11),
            children: [
              {
                name: 'div.counter-wrapper',
                kind: 7,
                range: range(1, 2, 2, 8),
                children: [],
              },
            ],
          },
          {
            name: 'script',
            kind: 7,
            range: range(5, 0, 13, 9),
            children: [
              {
                name: 'default',
                kind: 12,
                range: range(6, 0, 12, 1),
                children: [],
              },
            ],
          },
          {
            name: 'style',
            kind: 7,
            range: range(15, 0, 19, 8),
            children: [
              {
                name: '.counter-wrapper > *',
                kind: 4,
                range: range(16, 0, 18, 1),
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });
});

async function testSymbol(docUri: vscode.Uri, expectedSymbols: PartialDocumentSymbol[]) {
  await showFile(docUri);

  const result = (await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider',
    docUri
  )) as vscode.DocumentSymbol[];

  const partialSymbols = result.map(convertToPartialDocumentSymbols);
  assertEqualSymbols(expectedSymbols, partialSymbols);
}

function assertEqualSymbols(expectedSymbols: PartialDocumentSymbol[], actualSymbols: PartialDocumentSymbol[]) {
  expectedSymbols.forEach((es, i) => {
    const as = actualSymbols[i];
    assert.equal(es.name, as.name);
    assert.equal(es.kind, as.kind);
    assert.deepStrictEqual(es.range, as.range);
    if (es.children && as.children) {
      assertEqualSymbols(es.children, as.children);
    }
  });
}

interface PartialDocumentSymbol {
  name: string;
  range: vscode.Range;
  kind: vscode.SymbolKind;
  children?: PartialDocumentSymbol[];
}

function convertToPartialDocumentSymbols(symbol: vscode.DocumentSymbol): PartialDocumentSymbol {
  const ps: PartialDocumentSymbol = {
    name: symbol.name,
    kind: symbol.kind,
    range: symbol.range,
  };
  if (symbol.children) {
    ps.children = symbol.children.map(convertToPartialDocumentSymbols);
  }
  return ps;
}
