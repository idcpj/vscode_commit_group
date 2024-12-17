import * as vscode from 'vscode';
import { GitTreeItemFile } from './GitTreeItemFile';
import { Change } from '../../@type/git';
import { getGroupNameByType, GitGroupName_Untracked, GitGroupName_Working, GroupNameType as GroupType } from '../../const';
import { GitTreeItemGroupJson } from '../../@type/type';

export class GitTreeItemGroup extends vscode.TreeItem {
    private type: GroupType;
    public active: boolean;
    public files: GitTreeItemFile[];

    constructor(
        type: GroupType,
        label: string,
        active: boolean=false,
        files: GitTreeItemFile[]=[],
    ) {



        if(type == GitGroupName_Untracked){
            label = getGroupNameByType(type);
        }


        super(label, vscode.TreeItemCollapsibleState.Collapsed);

        let contextValue = 'group';

        // 未跟踪的,不能删除
        if(type == GitGroupName_Untracked){
            contextValue = 'group-disabled';
        }else{
            contextValue = active ? 'group-active' : 'group-inactive';
        }


        this.type = type;
        this.active = active;
        this.contextValue = contextValue;
        this.id = label;
        this.files = files;
        this.iconPath = active?new vscode.ThemeIcon('check'):new vscode.ThemeIcon('folder');

        this.description = vscode.l10n.t('File Count {0}', this.files.length);
    }

    checkActive(){
        this.active = true;
        this.iconPath = new vscode.ThemeIcon('check');
        this.contextValue = 'group-active';
    }

    uncheckActive(){
        this.active = false;
        this.iconPath = new vscode.ThemeIcon('folder');
        this.contextValue = 'group-inactive';
    }

    addFile(file: GitTreeItemFile){
        file.setGroup(this);
        this.files.push(file);
        this.description = vscode.l10n.t('File Count {0}', this.files.length);
    }
    

    addFileByChange(change: Change){
        this.files.push(new GitTreeItemFile(change.uri.fsPath,this,change));
        this.description = vscode.l10n.t('File Count {0}', this.files.length);
    }

    removeFile(file: string){
        this.files = this.files.filter(f => f.resourceUri?.fsPath !== file);
        this.description = vscode.l10n.t('File Count {0}', this.files.length);
    }

    getType():GroupType{
        return this.type;
    }

    
    getLabel():string{
        return this.label as string;
    }

    getFileList():GitTreeItemFile[]{
        return this.files;
    }
    
    toJson():GitTreeItemGroupJson{
        return {
            type: this.type,
            label: this.label as string,
            active: this.active
        };
    }

    public setLabel(label: string) {
        this.label = label;
        this.id = label;
    }

} 