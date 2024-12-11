import * as vscode from 'vscode';
import { GitFileProvider } from './lib/GitFileProvider';
import { GroupItem } from './lib/GroupItem';

export function activate(context: vscode.ExtensionContext) {


    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
    }
    
    const gitFileProvider = new GitFileProvider(workspaceRoot);

    // 注册视图
    const treeView = vscode.window.createTreeView('commit-group-view', {
        treeDataProvider: gitFileProvider
    });



    // 注册命令
    context.subscriptions.push(
        // 刷新命令
        vscode.commands.registerCommand('commit-group.refresh', () => {
            gitFileProvider.refresh();
        }),

        // 展开所有命令
        vscode.commands.registerCommand('commit-group.expandAll', async () => {
            const allItems = await gitFileProvider.getAllItems();
            for (const item of allItems) {
                treeView.reveal(item, {
                    expand: true,
                    select: false
                });
            }
        }),

        // 折叠所有命令
        vscode.commands.registerCommand('commit-group.collapseAll', () => {
            vscode.commands.executeCommand('workbench.actions.treeView.commit-group-view.collapseAll');
        }),

        // 新建分组命令
        vscode.commands.registerCommand('commit-group.addGroup', async () => {
            // 创建一个 TreeItem 作为可编辑项
            const editableItem = new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None);
            editableItem.command = {
                command: 'commit-group.startEditing',
                title: '开始编辑'
            };

            // 注册编辑命令
            vscode.commands.registerCommand('commit-group.startEditing', async () => {
                const groupName = await vscode.window.showInputBox({
                    placeHolder: '输入分组名称并回车',
                    validateInput: (value) => {
                        if (!value) return '名称不能为空';
                        if (gitFileProvider.getGroups(value)) return '分组名称已存在';
                        return null;
                    }
                });

                if (groupName) {
                    await gitFileProvider.addGroup(groupName);
                }
            });

        }),

        // 删除分组命令
        vscode.commands.registerCommand('commit-group.deleteGroup', (item: GroupItem) => {
            console.log("delte group item:",item)
            gitFileProvider.deleteGroup(item.label);
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