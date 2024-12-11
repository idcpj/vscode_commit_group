import * as vscode from 'vscode';
import { GitFileItem } from './GitFileItem';

export class GroupItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly files: GitFileItem[],
        public readonly icon: vscode.ThemeIcon,
        filesCount: number
    ) {
        super(label, collapsibleState);
        this.contextValue = 'group';
        this.iconPath = icon;
        this.description = `${filesCount} 个文件`;
    }
} 