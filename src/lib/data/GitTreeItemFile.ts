import * as vscode from 'vscode';
import { Change } from '../../@type/git';
import * as path from 'path';
import { GitTreeItemGroup } from './GitTreeItemGroup';
import { GitTreeItemFileJson } from '../../@type/type';

export class GitTreeItemFile extends vscode.TreeItem {
    private filepath:string;
    private change?:Change;
    private group:GitTreeItemGroup;
    constructor(
        filepath:string,
        group:GitTreeItemGroup,
        change?:Change,
    ) {
        super(path.basename(filepath), vscode.TreeItemCollapsibleState.None);
        
        this.group=group;
        this.filepath=filepath;
        if(change){
            this.change = change;
        }
        this.tooltip = `${filepath}`;
        this.contextValue = 'file';
        
        // 根据文件后缀自动获取图标
        this.iconPath = new vscode.ThemeIcon('file');
        this.resourceUri = vscode.Uri.file(filepath); // 设置 resourceUri 后 VS Code 会自动根据文件类型显示对应图标

        // 添加点击命令
        this.command = {
            command: 'vscode.open',
            title: vscode.l10n.t('Open File'),
            arguments: [vscode.Uri.file(filepath)]
        };
    }

    public getGroup():GitTreeItemGroup{
        return this.group;
    }

    public setGroup(group:GitTreeItemGroup){
        this.group=group;
    }

    public setChange(change:Change){
        this.change=change;
    }


    public getChange():Change|undefined{
        return this?.change||undefined;
    }
   
    public getFilePath():string{
        return this.filepath;
    }

    public toJson():GitTreeItemFileJson{
        return {
            filepath: this.filepath,
            groupLabel: this.group.getLabel(),
        };
    }

} 