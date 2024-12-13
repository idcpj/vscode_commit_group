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

    constructor(sdk:SdkType) {
        this.sdk=sdk;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GitTreeItemGroup | GitTreeItemFile): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GitTreeItemGroup | GitTreeItemFile) {

        try {

            if (!element) {
                this.sdk.getGitGroupManager().relaod();
                await this.sdk.getGitManager().loadFileList();
                const groups= this.sdk.getGitGroupManager().getGroups()
                return groups;
            }

            // 转换为 GroupItem 数组，只显示有文件的分组
            if (element instanceof GitTreeItemGroup) {
                return element.files;
            }

            if (element instanceof GitTreeItemFile) {
                throw new Error('GitFileItem is not a valid element');
            }
            return []

        } catch (error) {
            console.error('Error getting git changes:', error);
            vscode.window.showErrorMessage(`Error getting git changes: ${error}`);
            return [];
        }
    }




}