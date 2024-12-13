import * as vscode from 'vscode';
import { GitTreeItemFile } from './GitTreeItemFile';
import { Change } from '../@type/git';

export class GitTreeItemGroup extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public label: string,
        public order: number,
        public active: boolean=false,
        public files: GitTreeItemFile[]=[],
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);

        this.contextValue = 'group';
        this.id = id;
        this.order = order;
        this.active = active;
        this.files = files;
        this.iconPath = active?new vscode.ThemeIcon('check'):new vscode.ThemeIcon('folder');

        this.description = `${this.files.length} 个文件`;
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