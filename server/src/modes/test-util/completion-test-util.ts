import assert from 'assert';
import {
  CompletionList,
  CompletionItemKind,
  Position,
  CompletionItem,
  TextEdit,
  InsertReplaceEdit
} from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface CompletionTestSetup {
  doComplete(doc: TextDocument, pos: Position): CompletionList;
  langId: string;
  docUri: string;
}

export function testDSL(setup: CompletionTestSetup): (text: TemplateStringsArray) => CompletionAsserter {
  return function test([value]: TemplateStringsArray) {
    const offset = value.indexOf('|');
    value = value.substr(0, offset) + value.substr(offset + 1);

    const document = TextDocument.create(setup.docUri, setup.langId, 0, value);
    const position = document.positionAt(offset);
    const items = setup.doComplete(document, position).items;
    return new CompletionAsserter(items, document);
  };
}

export class CompletionAsserter {
  lastMatch!: CompletionItem;
  constructor(public items: CompletionItem[], public doc: TextDocument) {}
  count(expect: number) {
    const actual = this.items.length;
    assert.equal(actual, expect, `Expect completions has length: ${expect}, actual: ${actual}`);
    return this;
  }
  has(label: string) {
    const items = this.items;
    const matches = items.filter((completion) => completion.label === label);
    assert.equal(
      matches.length,
      1,
      label + ' should only existing once: Actual: ' + items.map((c) => c.label).join(', ')
    );
    this.lastMatch = matches[0];
    return this;
  }
  withDoc(doc: string) {
    const documentation = this.lastMatch.documentation;
    if (typeof documentation === 'object' && documentation !== null) {
      assert.equal(documentation.value, doc);
    } else {
      assert.equal(documentation, doc);
    }
    return this;
  }
  withKind(kind: CompletionItemKind) {
    assert.equal(this.lastMatch.kind, kind);
    return this;
  }
  become(resultText: string) {
    assert.equal(applyEdits(this.doc, [this.lastMatch.textEdit!]), resultText);
    return this;
  }
  hasNo(label: string) {
    this.lastMatch = undefined as any;
    const items = this.items;
    const matches = items.filter((completion) => completion.label === label);
    assert.equal(matches.length, 0, label + ' should not exist. Actual: ' + items.map((c) => c.label).join(', '));
    return this;
  }
}

function applyEdits(document: TextDocument, edits: (TextEdit | InsertReplaceEdit | undefined)[]): string {
  let text = document.getText();

  const textEdits = edits.filter(isTextEdit);
  const textReplaceEdits = edits.filter(isInsertReplaceEdit);

  text = applyTextEdits(document, text, textEdits);
  text = applyInsertReplaceEdits(document, text, textReplaceEdits);
  return text;
}

function applyTextEdits(document: TextDocument, text: string, edits: TextEdit[]) {
  const sortedEdits = edits.sort((a, b) => document.offsetAt(b.range.start) - document.offsetAt(a.range.start));
  let lastOffset = text.length;
  sortedEdits.forEach((e) => {
    const startOffset = document.offsetAt(e.range.start);
    const endOffset = document.offsetAt(e.range.end);
    assert.ok(startOffset <= endOffset);
    assert.ok(endOffset <= lastOffset);
    text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
    lastOffset = startOffset;
  });

  return text;
}

function applyInsertReplaceEdits(document: TextDocument, text: string, edits: InsertReplaceEdit[]) {
  if (edits.length > 0) {
    throw new Error('applyInsertReplaceEdits is not implemented');
  }

  return text;
}

function isTextEdit(value: TextEdit | InsertReplaceEdit | undefined): value is TextEdit {
  return !!value && 'range' in value;
}

function isInsertReplaceEdit(value: TextEdit | InsertReplaceEdit | undefined): value is InsertReplaceEdit {
  return !!value && ('insert' in value || 'replace' in value);
}
