import * as vscode from 'vscode';
import { GitTreeItemFile } from './data/GitTreeItemFile';
import { GitTreeItemGroup } from './data/GitTreeItemGroup';
import { SdkType } from '../@type/type';
import { sleep } from '../help/time';

export class GitFileProvider implements vscode.TreeDataProvider<GitTreeItemGroup | GitTreeItemFile> {
    private _onDidChangeTreeData: vscode.EventEmitter<GitTreeItemGroup | GitTreeItemFile | undefined | null | void> = new vscode.EventEmitter<GitTreeItemGroup | GitTreeItemFile | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GitTreeItemGroup | GitTreeItemFile | undefined | null | void> = this._onDidChangeTreeData.event;

    // 使用 Map 存储分组信息，便于管理
    private sdk: SdkType;

    constructor(sdk: SdkType) {
        this.sdk = sdk;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GitTreeItemGroup | GitTreeItemFile): vscode.TreeItem {
        return element;
    }

    getParent(element: GitTreeItemGroup | GitTreeItemFile): GitTreeItemGroup | null {
        if (element instanceof GitTreeItemGroup) {
            return null;
        }
        if (element instanceof GitTreeItemFile) {
            return element.getGroup();
        }
        return null;
    }

    resolveTreeItem(item: GitTreeItemGroup | GitTreeItemFile, element: GitTreeItemGroup | GitTreeItemFile, token: vscode.CancellationToken): vscode.TreeItem | undefined {
        return item;
    }

    getChildren(element?: GitTreeItemGroup | GitTreeItemFile) {

        try {
            // 如果 Git 仓库未初始化,则不显示任何内容
            if (!this.sdk.getGitManager().isActive()) {
                console.log(vscode.l10n.t('Workspace Not Initialized As Git'));
                return 
            }


            if (!element) {
                this.sdk.getGroupManager().relaod();
                this.sdk.getGitManager().loadFileList();
                this.sdk.getGroupManager().cache_save();

                const groups = this.sdk.getGroupManager().group_lists()
                this.sdk.getTreeViewManager().setTag(groups.length);
                return groups;
            }

            // 转换为 GroupItem 数组，只显示有文件的分组
            if (element instanceof GitTreeItemGroup) {
                return element.files;
            }

            if (element instanceof GitTreeItemFile) {
                throw new Error(vscode.l10n.t('Invalid Git File Item {0}', element.getFilePath()));
            }
            return []

        } catch (error: any) {
            console.error('Error getting git changes:', error);
            vscode.window.showErrorMessage(vscode.l10n.t('Failed To Get Git Changes {0}', error.toString()));
            return [];
        }
    }



}