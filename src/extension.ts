import * as vscode from 'vscode';
import { Sdk } from './bin/sdk';
import { GitTreeItemFile } from './lib/data/GitTreeItemFile';
import { sleep } from './help/time';


export async function activate(context: vscode.ExtensionContext) {


    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspaceRoot) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
    }

    const sdk = new Sdk(workspaceRoot,context)

    sdk.afterRun(async ()=>{
        
        // 注册命令
        context.subscriptions.push(

            // vscode.window.registerWebviewViewProvider( "commit-input-view", sdk.webview_form() ),

            vscode.commands.registerCommand('commit-group.revealItem', sdk.cmd_revealItem.bind(sdk)),
            
            // 刷新命令
            vscode.commands.registerCommand('commit-group.refresh',sdk.cmd_refresh.bind(sdk)),


            // 新建分组命令
            vscode.commands.registerCommand('commit-group.addGroup', sdk.cmd_addGroup.bind(sdk)),


            // 激活分组
            vscode.commands.registerCommand('commit-group.activeGroup',sdk.cmd_activeGroup.bind(sdk)),

            // 重命名分组
            vscode.commands.registerCommand('commit-group.renameGroup', sdk.cmd_renameGroup.bind(sdk)),

            // 删除分组命令
            vscode.commands.registerCommand('commit-group.deleteGroup',sdk.cmd_deleteGroup.bind(sdk)),

            // 导出文件命令
            vscode.commands.registerCommand('commit-group.exportFiles', sdk.cmd_exportFiles.bind(sdk)),

            // 打开更改命令
            vscode.commands.registerCommand('commit-group.openChange', sdk.cmd_openChange.bind(sdk)),

        );

    });
    sdk.run();

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider( "commit-input-view", sdk.webview_form() ),
    )


}

export function deactivate() {
    console.log('Commit Group extension deactivated');
}
