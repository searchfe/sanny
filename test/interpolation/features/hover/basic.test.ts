import * as vscode from 'vscode';
import * as assert from 'assert';
import { showFile } from '../../../editorHelper';
import { position, sameLineRange } from '../../../util';
import { getDocUri } from '../../path';

describe('Should do hover interpolation for <template>', () => {
  const docUri = getDocUri('hover/Basic.vue');

  it('shows hover for msg in mustache', async () => {
    await testHover(docUri, position(2, 11), {
      contents: ['\n```ts\n(property) msg: string\n```\n'],
      range: sameLineRange(2, 10, 13),
    });
  });

  it('shows hover for v-for variable', async () => {
    await testHover(docUri, position(5, 20), {
      contents: ['\n```ts\n(parameter) item: number\n```\n'],
      range: sameLineRange(5, 18, 22),
    });
  });

  it('shows hover for v-for variable on readonly array', async () => {
    await testHover(docUri, position(10, 20), {
      contents: ['\n```ts\n(parameter) item: string\n```\n'],
      range: sameLineRange(10, 18, 22),
    });
  });
});

async function testHover(docUri: vscode.Uri, position: vscode.Position, expectedHover: vscode.Hover) {
  await showFile(docUri);

  const result = (await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    docUri,
    position
  )) as vscode.Hover[];

  if (!result[0]) {
    throw Error('Hover failed');
  }

  const contents = result[0].contents;
  contents.forEach((c, i) => {
    const actualContent = markedStringToSTring(c);
    const expectedContent = markedStringToSTring(expectedHover.contents[i]);
    assert.ok(actualContent.startsWith(expectedContent));
  });

  if (result[0] && result[0].range) {
    assert.ok(result[0].range!.isEqual(expectedHover.range!));
  }
}

function markedStringToSTring(s: vscode.MarkedString) {
  return typeof s === 'string' ? s : s.value;
}
