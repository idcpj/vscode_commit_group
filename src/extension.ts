import * as vscode from 'vscode';
import { Sdk } from './bin/sdk';
import { GitTreeItemFile } from './lib/data/GitTreeItemFile';

export async function activate(context: vscode.ExtensionContext) {


    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspaceRoot) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
    }

    const sdk = new Sdk(workspaceRoot,context)

    sdk.run();



    // 注册视图
    const treeView = vscode.window.createTreeView('commit-group-view', {
        treeDataProvider: sdk.getGitFileProvider(),
        dragAndDropController: sdk.getGitFileTreeDrop(),
        canSelectMany: true,
        showCollapseAll: true,
    });


    // treeView.message = '1234';
    // 标签
    // treeView.badge = <vscode.ViewBadge>{
    //     tooltip: `${sdk.getGitGroupManager().getGroups().length}个分组`,
    //     value: sdk.getGitGroupManager().getGroups().length
    // };


    // 注册命令
    context.subscriptions.push(

        vscode.commands.registerCommand('commit-group.revealItem', sdk.cmd_revealItem.bind(sdk)),
        
        // 刷新命令
        vscode.commands.registerCommand('commit-group.refresh',sdk.cmd_refresh.bind(sdk)),


        // 新建分组命令
        vscode.commands.registerCommand('commit-group.addGroup', sdk.cmd_addGroup.bind(sdk)),

        // 删除分组命令
        vscode.commands.registerCommand('commit-group.deleteGroup',sdk.cmd_deleteGroup.bind(sdk)),

        // 激活分组
        vscode.commands.registerCommand('commit-group.activeGroup',sdk.cmd_activeGroup.bind(sdk)),

    );

}

export function deactivate() {
    console.log('Commit Group extension deactivated');
}
