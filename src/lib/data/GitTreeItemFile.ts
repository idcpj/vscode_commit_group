import * as vscode from 'vscode';
import { Change } from '../../@type/git';
import * as path from 'path';
import { GitTreeItemGroup } from './GitTreeItemGroup';

export class GitTreeItemFile extends vscode.TreeItem {
    private change:Change;
    private group:GitTreeItemGroup;
    constructor(
        change:Change,
        group:GitTreeItemGroup,
    ) {
        super(path.basename(change.uri.fsPath), vscode.TreeItemCollapsibleState.None);
        
        this.group=group;
        this.change = change;
        this.tooltip = `${change.status}: ${change.uri.fsPath}`;
        this.contextValue = 'file.draggable';
        
        // 根据文件后缀自动获取图标
        this.iconPath = new vscode.ThemeIcon('file');
        this.resourceUri = vscode.Uri.file(change.uri.fsPath); // 设置 resourceUri 后 VS Code 会自动根据文件类型显示对应图标

    }

    public getGroup():GitTreeItemGroup{
        return this.group;
    }

    public setGroup(group:GitTreeItemGroup){
        this.group=group;
    }

    
    public getChange():Change{
        return this.change;
    }
   
    public getFilePath():string{
        return this.change.uri.fsPath;
    }

} 