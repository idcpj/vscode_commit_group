import { Repository } from "../@type/git";
import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager } from "../lib/GitGroupManager";
import * as vscode from 'vscode';
import { GitManager } from "../lib/GitManager";
import { SdkType } from "../@type/type";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitTreeItemGroup } from "../lib/data/GitTreeItemGroup";
import { GitTreeItemFile } from "../lib/data/GitTreeItemFile";

export class Sdk implements SdkType {

    private workspaceRoot: string;
    private gitFileProvider: GitFileProvider;
    private gitGroupManager: GitGroupManager;
    private gitManager: GitManager;
    private context: vscode.ExtensionContext;
    private gitFileTreeDrop: GitFileTreeDrop;
    private treeView: vscode.TreeView<GitTreeItemGroup|GitTreeItemFile>;

    constructor(workspaceRoot: string, context: vscode.ExtensionContext) {
        this.workspaceRoot = workspaceRoot;

        this.context = context;
        this.gitGroupManager = new GitGroupManager(this);
        this.gitFileProvider = new GitFileProvider(this);
        this.gitFileTreeDrop = new GitFileTreeDrop(this);
        this.treeView = vscode.window.createTreeView('commit-group-view', {
            treeDataProvider: this.gitFileProvider,
            dragAndDropController: this.gitFileTreeDrop,
            canSelectMany: true,
            showCollapseAll: true,
        });

        this.gitManager = new GitManager(this);
    }

 
    run(){
        this.getGitManager().run();
    }

    getTreeView(): vscode.TreeView<GitTreeItemGroup | GitTreeItemFile> {
        return this.treeView;
    }

    public getGitFileTreeDrop(): GitFileTreeDrop {
        return this.gitFileTreeDrop;
    }

    public getGitFileProvider() {
        return this.gitFileProvider;
    }

    public getGitGroupManager() {
        return this.gitGroupManager;
    }

    public getGitManager() {
        return this.gitManager;
    }

    public getWorkspaceRoot() {
        return this.workspaceRoot;
    }
    public getContext() {
        return this.context;
    }

    refresh() {
        this.gitFileProvider.refresh();
    }

    cmd_refresh() {
        this.refresh();
    }

    async cmd_revealItem(item: GitTreeItemGroup|GitTreeItemFile) {
        await this.getTreeView().reveal(item, {
            select: true,
            focus: true,
            expand: true
        });
    }

    async cmd_addGroup() {
        const groupName = await vscode.window.showInputBox({
            placeHolder: '输入分组名称并回车',
            validateInput: (value) => {
                if (!value) return '名称不能为空';
                if (this.getGitGroupManager().group_isExist(value)) return '分组名称已存在';
                return null;
            }
        });

        if (groupName) {
            this.getGitGroupManager().group_add(groupName);
            this.refresh();
        }
    }

    cmd_deleteGroup(item: GitTreeItemGroup) {
        try {
            this.getGitGroupManager().group_deleteByName(item.label);
            this.refresh();
        } catch (e) {
            vscode.window.showErrorMessage(`删除分组失败:${e}`);
        }
    }

    cmd_activeGroup(item: GitTreeItemGroup) {
        try {
            this.getGitGroupManager().group_setActive(item.label);
            this.refresh();
        } catch (e) {
            vscode.window.showErrorMessage(`切换激活状态失败:${e}`);
        }
    }
  
}