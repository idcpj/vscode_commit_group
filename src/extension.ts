import * as vscode from 'vscode';
import { Sdk } from './bin/sdk';

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
        // manageCheckboxStateManually: true,
        // canSelectMany: true,
        // showCollapseAll: true,
    });



    // 注册命令
    context.subscriptions.push(
        // 刷新命令
        vscode.commands.registerCommand('commit-group.refresh',sdk.cmd_refresh.bind(sdk)),

        // 展开所有命令
        vscode.commands.registerCommand('commit-group.expandAll', sdk.cmd_expandAll.bind(sdk,treeView)),

        // 折叠所有命令
        vscode.commands.registerCommand('commit-group.collapseAll', () => {
            vscode.commands.executeCommand('workbench.actions.treeView.commit-group-view.collapseAll');
        }),

        // 新建分组命令
        vscode.commands.registerCommand('commit-group.addGroup', sdk.cmd_addGroup.bind(sdk)),

        // 删除分组命令
        vscode.commands.registerCommand('commit-group.deleteGroup',sdk.cmd_deleteGroup.bind(sdk)),

        // 激活分组
        vscode.commands.registerCommand('commit-group.activeGroup',sdk.cmd_activeGroup.bind(sdk)),

    );




    // 监听文件系统变化
    // const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    // fileSystemWatcher.onDidChange(() => gitFileProvider.refresh());
    // fileSystemWatcher.onDidCreate(() => gitFileProvider.refresh());
    // fileSystemWatcher.onDidDelete(() => gitFileProvider.refresh());

    // context.subscriptions.push(treeView, fileSystemWatcher);
}

export function deactivate() {
    console.log('Commit Group extension deactivated');
}
