import vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { generateGrammarCommandHandler } from './commands/generateGrammarCommand';
import { registerLanguageConfigurations } from './languages';
import { initializeLanguageClient } from './client';
import { join } from 'path';
import {
  setVirtualContents,
  registerVeturTextDocumentProviders,
  generateShowVirtualFileCommand,
} from './commands/virtualFileCommand';
import { getGlobalSnippetDir } from './userSnippetDir';
import { generateOpenUserScaffoldSnippetFolderCommand } from './commands/openUserScaffoldSnippetFolderCommand';
import { generateDoctorCommand } from './commands/doctorCommand';

export async function activate(context: vscode.ExtensionContext) {
  const isInsiders = vscode.env.appName.includes('Insiders');
  const globalSnippetDir = getGlobalSnippetDir(isInsiders);

  /**
   * Virtual file display command for debugging template interpolation
   */
  context.subscriptions.push(await registerVeturTextDocumentProviders());

  /**
   * Custom Block Grammar generation command
   */
  context.subscriptions.push(
    vscode.commands.registerCommand('vetur.generateGrammar', generateGrammarCommandHandler(context.extensionPath))
  );

  /**
   * Open custom snippet folder
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vetur.openUserScaffoldSnippetFolder',
      generateOpenUserScaffoldSnippetFolderCommand(globalSnippetDir)
    )
  );

  // context.subscriptions.push(
  //   vscode.commands.registerCommand('vetur.chooseTypeScriptRefactoring', (args: any) => {
  //     client.sendRequest<WorkspaceEdit | undefined>('requestCodeActionEdits', args).then((edits) => {
  //       if (edits) {
  //         vscode.workspace.applyEdit(client.protocol2CodeConverter.asWorkspaceEdit(edits)!);
  //       }
  //     });
  //   })
  // );

  registerLanguageConfigurations();

  /**
   * San Language Server Initialization
   */

  const serverModule = context.asAbsolutePath(join('server', 'dist', 'vueServerMain.js'));
  const client = initializeLanguageClient(serverModule, globalSnippetDir);
  context.subscriptions.push(client.start());

  const promise = client
    .onReady()
    .then(() => {
      registerCustomClientNotificationHandlers(client);
      registerCustomLSPCommands(context, client);
      registerRestartVLSCommand(context, client);
    })
    .catch(e => {
      console.error(e.stack);
      console.log('Client initialization failed');
    });

  return displayInitProgress(promise);
}

async function displayInitProgress(promise: Promise<void>) {
  return vscode.window.withProgress(
    {
      title: 'Sanny initialization',
      location: vscode.ProgressLocation.Window,
    },
    () => promise
  );
}

function registerRestartVLSCommand(context: vscode.ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vetur.restartVLS', () =>
      displayInitProgress(
        client
          .stop()
          .then(() => client.start())
          .then(() => client.onReady())
      )
    )
  );
}

function registerCustomClientNotificationHandlers(client: LanguageClient) {
  client.onNotification('$/openWebsite', (url: string) => {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });
  client.onNotification('$/showVirtualFile', (virtualFileSource: string, prettySourceMap: string) => {
    setVirtualContents(virtualFileSource, prettySourceMap);
  });
}

function registerCustomLSPCommands(context: vscode.ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vetur.showCorrespondingVirtualFile', generateShowVirtualFileCommand(client)),
    vscode.commands.registerCommand('vetur.showOutputChannel', () => client.outputChannel.show()),
    vscode.commands.registerCommand('vetur.showDoctorInfo', generateDoctorCommand(client))
  );
}
