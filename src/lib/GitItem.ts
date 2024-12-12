import * as vscode from 'vscode';

export class GitItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly status: string,
        public readonly filePath: string,
        public readonly icon: vscode.ThemeIcon
    ) {
        super(label, collapsibleState);
        
        this.tooltip = `${status}: ${filePath}`;
        this.description = status;
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(filePath)]
        };
        this.iconPath = icon;
        this.contextValue = 'file';
        // 使用 git 提供的文件图标
        this.resourceUri = vscode.Uri.file(filePath);
    }
} 