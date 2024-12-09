import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 创建树视图提供者
    const treeDataProvider = new class implements vscode.TreeDataProvider<any> {
        getTreeItem(element: any): vscode.TreeItem {
            return element;
        }
        getChildren(element?: any): Thenable<any[]> {
            return Promise.resolve([]); // 暂时返回空数组
        }
    };

    // 注册视图
    vscode.window.createTreeView('commit-group-view', {
        treeDataProvider: treeDataProvider
    });
} 