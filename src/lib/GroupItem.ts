import * as vscode from 'vscode';
import { GitFileItem } from './GitFileItem';

export class GroupItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly files: GitFileItem[]
    ) {
        super(label, collapsibleState);
        this.contextValue = 'group';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
} 