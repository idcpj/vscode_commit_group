import * as vscode from 'vscode';
import { GitFileItem } from './GitFileItem';

export class GroupItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public label: string,
        public order: number,
        public active: boolean=false,
        public files: GitFileItem[]=[],
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

    addFile(file: GitFileItem){
        this.files.push(file);
        this.description = `${this.files.length} 个文件`;
    }

    removeFile(file: GitFileItem){
        this.files = this.files.filter(f => f.id !== file.id);
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