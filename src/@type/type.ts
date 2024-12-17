import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager } from "../lib/GitGroupManager";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitManager } from "../lib/GitManager";
import * as vscode from 'vscode';
import { TreeViewManager } from "../lib/TreeViewManager";
import { WebviewViewManager } from "../lib/WebviewViewManager";


export type Callback=()=>void;

export interface SdkType {

    getGitFileProvider(): GitFileProvider;

    getGitGroupManager(): GitGroupManager;

    getGitManager(): GitManager;

    getGitFileTreeDrop(): GitFileTreeDrop;

    getContext(): vscode.ExtensionContext;

    getTreeViewManager(): TreeViewManager;

    getWebviewViewManager(): WebviewViewManager;
    

    refresh(): void;

    afterRun(fn:Callback):void;

    getWorkspaceRoot(): string;

}

export interface GitTreeItemFileJson{
    filepath:string;
    groupLabel:string;
}


export interface GitTreeItemGroupJson{
    label:string;
    active:boolean;
}
