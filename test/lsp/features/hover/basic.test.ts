import * as assert from 'assert';
import * as vscode from 'vscode';
import { showFile } from '../../../editorHelper';
import { position, sameLineRange } from '../../../util';
import { getDocUri } from '../../path';

describe('Should do hover', () => {
  const docUri = getDocUri('hover/Basic.vue');

  it('shows hover for <img> tag', async () => {
    await testHover(docUri, position(4, 7), {
      contents: ['An img element represents an image.'],
      range: sameLineRange(4, 7, 10),
    });
  });

  it('shows hover for this.msg', async () => {
    await testHover(docUri, position(33, 23), {
      contents: ['\n```ts\n(property) msg: string\n```\n'],
      range: sameLineRange(33, 23, 26),
    });
  });

  it('shows hover for `width` in <style>', async () => {
    await testHover(docUri, position(47, 3), {
      contents: [
        // tslint:disable-next-line
        `Specifies the width of the content area, padding area or border area (depending on 'box-sizing') of certain boxes.`,
      ],
      range: sameLineRange(47, 2, 14),
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
