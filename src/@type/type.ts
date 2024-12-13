import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager } from "../lib/GitGroupManager";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitManager } from "../lib/GitManager";
import * as vscode from 'vscode';

export interface SdkType {

    getGitFileProvider(): GitFileProvider;

    getGitGroupManager(): GitGroupManager;

    getGitManager(): GitManager;

    getWorkspaceRoot(): string;

    getGitFileTreeDrop(): GitFileTreeDrop;

    getContext(): vscode.ExtensionContext;
    

    refresh(): void;
}
