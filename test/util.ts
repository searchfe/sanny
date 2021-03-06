import * as vscode from 'vscode';

export function position(line: number, char: number) {
  return new vscode.Position(line, char);
}
export function range(startLine: number, startChar: number, endLine: number, endChar: number) {
  return new vscode.Range(position(startLine, startChar), position(endLine, endChar));
}
export function sameLineRange(line: number, startChar: number, endChar: number) {
  return new vscode.Range(position(line, startChar), position(line, endChar));
}
export function location(uri: vscode.Uri, startLine: number, startChar: number, endLine: number, endChar: number) {
  return new vscode.Location(uri, range(startLine, startChar, endLine, endChar));
}
export function sameLineLocation(uri: vscode.Uri, line: number, startChar: number, endChar: number) {
  return new vscode.Location(uri, sameLineRange(line, startChar, endChar));
}
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
