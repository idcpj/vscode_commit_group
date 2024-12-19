import * as vscode from 'vscode';
import { Sdk } from './bin/sdk';

export async function activate(context: vscode.ExtensionContext) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
    const sdk = new Sdk(workspaceRoot, context);
    sdk.run();

    // 将所有命令注册放在这里
    context.subscriptions.push(
        // 刷新命令
        vscode.commands.registerCommand('commit-group.refresh', sdk.cmd_refresh.bind(sdk)),

        // 新建分组命令
        vscode.commands.registerCommand('commit-group.addGroup', sdk.cmd_addGroup.bind(sdk)),

        // 激活分组
        vscode.commands.registerCommand('commit-group.activeGroup', sdk.cmd_activeGroup.bind(sdk)),

        // 重命名分组
        vscode.commands.registerCommand('commit-group.renameGroup', sdk.cmd_renameGroup.bind(sdk)),

        // 删除分组命令
        vscode.commands.registerCommand('commit-group.deleteGroup', sdk.cmd_deleteGroup.bind(sdk)),

        // 导出文件命令
        vscode.commands.registerCommand('commit-group.exportFiles', sdk.cmd_exportFiles.bind(sdk)),

        // 打开更改命令
        vscode.commands.registerCommand('commit-group.openChange', sdk.cmd_openChange.bind(sdk)),

        // 移动到其他分组命令
        vscode.commands.registerCommand('commit-group.moveToGroup', sdk.cmd_moveToGroup.bind(sdk)),

        // WebView Provider
        vscode.window.registerWebviewViewProvider("commit-input-view", sdk.webview_form())
    );
}

export function deactivate() {
    console.log('Commit Group extension deactivated');
}
