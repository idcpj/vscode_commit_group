import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager } from "../lib/GitGroupManager";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitManager } from "../lib/GitManager";
import * as vscode from 'vscode';
import { GitTreeItemGroup } from "../lib/data/GitTreeItemGroup";
import { GitTreeItemFile } from "../lib/data/GitTreeItemFile";

export interface SdkType {

    getGitFileProvider(): GitFileProvider;

    getGitGroupManager(): GitGroupManager;

    getGitManager(): GitManager;

    getWorkspaceRoot(): string;

    getGitFileTreeDrop(): GitFileTreeDrop;

    getContext(): vscode.ExtensionContext;

    getTreeView(): vscode.TreeView<GitTreeItemGroup|GitTreeItemFile>;
    

    refresh(): void;
}

export interface GitTreeItemFileJson{
    filepath:string;
    groupLabel:string;
}


export interface GitTreeItemGroupJson{
    label:string;
    active:boolean;
}
