import * as vscode from 'vscode';
import { Change } from '../@type/git';
import * as path from 'path';

export class GitFileItem extends vscode.TreeItem {
    private file:Change;
    constructor(
        file:Change,
    ) {
        super(path.basename(file.uri.fsPath), vscode.TreeItemCollapsibleState.None);
        
        this.file = file;
        this.tooltip = `${file.status}: ${file.uri.fsPath}`;
        this.description = this.getStatusText(file.status);
        this.contextValue = 'file.draggable';
        // 根据文件后缀自动获取图标
        this.iconPath = new vscode.ThemeIcon('file');
        this.resourceUri = vscode.Uri.file(file.uri.fsPath); // 设置 resourceUri 后 VS Code 会自动根据文件类型显示对应图标

        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(file.uri.fsPath)]
        };
    }

    private getStatusText(status: number): string {
        const statusMap: { [key: number]: string } = {
            0: '未修改',
            1: '已修改',
            2: '已添加',
            3: '已删除',
            4: '已重命名',
            5: '已复制',
            6: '未跟踪',
            7: '已忽略',
            8: '有冲突'
        };
        return statusMap[status] || '未知';
    }

} 