import * as vscode from 'vscode';
import { GitTreeItemFile } from './GitTreeItemFile';
import { Change } from '../../@type/git';
import { GitGroupName_Untracked } from '../../const';

export class GitTreeItemGroup extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public label: string,
        public order: number,
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
        this.id = id;
        this.order = order;
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
        this.files.push(new GitTreeItemFile(change,this));
        this.description = `${this.files.length} 个文件`;
    }

    removeFile(file: string){
        const index = this.files.findIndex(f => f.resourceUri?.fsPath === file);
        if (index !== -1) {
            this.files.splice(index, 1);
        }
        this.description = `${this.files.length} 个文件`;
    }

    
    
    toJson(){
        return {
            id: this.id,
            label: this.label,
            order: this.order,
            files: this.files,
            active: this.active
        };
    }

} 