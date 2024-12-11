import * as vscode from 'vscode';

export class GitFileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly status: string,
        public readonly filePath: string
    ) {
        super(label, collapsibleState);
        
        this.tooltip = `${status}: ${filePath}`;
        this.description = status;
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(filePath)]
        };
        // 使用 git 提供的文件图标
        this.resourceUri = vscode.Uri.file(filePath);
    }
} 