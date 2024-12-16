import * as vscode from 'vscode';
import { GitTreeItemFile } from './GitTreeItemFile';
import { Change } from '../../@type/git';
import { GitGroupName_Untracked } from '../../const';
import { GitTreeItemGroupJson } from '../../@type/type';

export class GitTreeItemGroup extends vscode.TreeItem {
    constructor(
        public label: string,
        public active: boolean=false,
        public files: GitTreeItemFile[]=[],
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);

        let contextValue = 'group';

        // 未跟踪的,不能删除
        if(label == GitGroupName_Untracked){
            contextValue = 'group-disabled';
        }else{
            contextValue = active ? 'group-active' : 'group-inactive';
        }


        this.active = active;
        this.contextValue = contextValue;
        this.id = label;
        this.files = files;
        this.iconPath = active?new vscode.ThemeIcon('check'):new vscode.ThemeIcon('folder');

        this.description = `${this.files.length} 个文件`;
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
        this.description = `${this.files.length} 个文件`;
    }
    

    addFileByChange(change: Change){
        this.files.push(new GitTreeItemFile(change.uri.fsPath,this,change));
        this.description = `${this.files.length} 个文件`;
    }

    removeFile(file: string){
        const index = this.files.findIndex(f => f.resourceUri?.fsPath === file);
        if (index !== -1) {
            this.files.splice(index, 1);
        }
        this.description = `${this.files.length} 个文件`;
    }

    
    getLabel():string{
        return this.label;
    }

    getFileList():GitTreeItemFile[]{
        return this.files;
    }
    
    toJson():GitTreeItemGroupJson{
        return {
            label: this.label,
            active: this.active
        };
    }

    public setLabel(label: string) {
        this.label = label;
        this.id = label;
    }

} 