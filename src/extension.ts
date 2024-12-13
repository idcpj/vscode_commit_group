import * as vscode from 'vscode';
import { GitFileProvider } from './lib/GitFileProvider';
import { GitTreeItemGroup } from './lib/GitTreeItemGroup';
import { GitGroupManager } from './lib/GitGroupManager';

export async function activate(context: vscode.ExtensionContext) {


    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspaceRoot) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
    }

    const groups = context.workspaceState.get<GitGroupManager>('commit-group.groups', new GitGroupManager([]));

    const gitFileProvider = new GitFileProvider(workspaceRoot, groups);

    // 注册视图
    const treeView = vscode.window.createTreeView('commit-group-view', {
        treeDataProvider: gitFileProvider,
        dragAndDropController: gitFileProvider,
        manageCheckboxStateManually: true,
        canSelectMany: true,
        showCollapseAll: true,
    });



    // 注册命令
    context.subscriptions.push(
        // 刷新命令
        vscode.commands.registerCommand('commit-group.refresh', () => {
            gitFileProvider.refresh();
        }),

        // 展开所有命令
        vscode.commands.registerCommand('commit-group.expandAll', async () => {
            vscode.commands.executeCommand('workbench.actions.treeView.commit-group-view.expandAll');
        }),

        // 折叠所有命令
        vscode.commands.registerCommand('commit-group.collapseAll', () => {
            vscode.commands.executeCommand('workbench.actions.treeView.commit-group-view.collapseAll');
        }),

        // 新建分组命令
        vscode.commands.registerCommand('commit-group.addGroup', async () => {
            const groupName = await vscode.window.showInputBox({
                placeHolder: '输入分组名称并回车',
                validateInput: (value) => {
                    if (!value) return '名称不能为空';
                    if (gitFileProvider.groupIsExist(value)) return '分组名称已存在';
                    return null;
                }
            });

            if (groupName) {
                gitFileProvider.addGroup(groupName);
            }
        }),



        // 删除分组命令
        vscode.commands.registerCommand('commit-group.deleteGroup', (item: GitTreeItemGroup) => {
            try{
                gitFileProvider.deleteGroup(item.label);
            }catch(e){
                vscode.window.showErrorMessage(`删除分组失败:${e}`);
            }
        })
    );

    // 增强 Git 变化监听
    // const gitExtension = vscode.extensions.getExtension('vscode.git');
    // if (gitExtension) {
    //     gitExtension.activate().then(git => {
    //         const api = git.getAPI(1);

    //         // 监听仓库状态变化
    //         api.onDidChangeState(() => {
    //             gitFileProvider.refresh();
    //         });

    //         // 监听具体仓库
    //         if (api.repositories[0]) {
    //             const repository = api.repositories[0];

    //             // 监听工作区变化
    //             repository.state.onDidChange(() => {
    //                 gitFileProvider.refresh();
    //             });

    //             // 监听索引变化
    //             // repository.state.onDidChangeIndex(() => {
    //             //     gitFileProvider.refresh();
    //             // });
    //         }
    //     });
    // }



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
