import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager } from "../lib/GroupManager";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitManager } from "../lib/GitManager";
import * as vscode from 'vscode';
import { TreeViewManager } from "../lib/TreeViewManager";
import { WebviewViewManager } from "../lib/WebviewViewManager";
import { GroupNameType } from "../const";


export type Callback=()=>void;

export interface SdkType {

    getGitFileProvider(): GitFileProvider;

    getGroupManager(): GitGroupManager;

    getGitManager(): GitManager;

    getGitFileTreeDrop(): GitFileTreeDrop;

    getContext(): vscode.ExtensionContext;

    getTreeViewManager(): TreeViewManager;

    getWebviewViewManager(): WebviewViewManager;
    

    refresh(): void;

    getWorkspaceRoot(): string;

}

export interface GitTreeItemFileJson{
    filepath:string;
    groupLabel:string;
}


export interface GitTreeItemGroupJson{ 
    type:GroupNameType;
    label:string;
    active:boolean;
}
