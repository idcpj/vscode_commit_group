import { Repository } from "../@type/git";
import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager } from "../lib/GitGroupManager";
import * as vscode from 'vscode';
import { GitManager } from "../lib/GitManager";
import { SdkType } from "../@type/type";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitTreeItemGroup } from "../lib/data/GitTreeItemGroup";
import { GitTreeItemFile } from "../lib/data/GitTreeItemFile";
import { TreeViewManager } from "../lib/TreeViewManager";
import { WebviewViewManager } from "../lib/WebviewViewManager";

export class Sdk implements SdkType {

    private workspaceRoot: string;
    private gitFileProvider: GitFileProvider;
    private gitGroupManager: GitGroupManager;
    private gitManager: GitManager;
    private context: vscode.ExtensionContext;
    private gitFileTreeDrop: GitFileTreeDrop;
    private treeViewManager: TreeViewManager;
    private webviewViewManager: WebviewViewManager;

    constructor(workspaceRoot: string, context: vscode.ExtensionContext) {
        this.workspaceRoot = workspaceRoot;

        this.context = context;
        this.gitGroupManager = new GitGroupManager(this);
        this.gitFileProvider = new GitFileProvider(this);
        this.gitFileTreeDrop = new GitFileTreeDrop(this);
        this.treeViewManager = new TreeViewManager(this);
        this.webviewViewManager = new WebviewViewManager(this);

        this.gitManager = new GitManager(this);
    }

 
    run(){
        this.getGitManager().run();
        this.getTreeViewManager().run();
    }

    getWebviewViewManager(): WebviewViewManager {
        // 如果 git 没有初始化,则不显示
        return this.webviewViewManager;
    }

    getTreeViewManager(): TreeViewManager {
        return this.treeViewManager;
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

    webview_form(){
        return this.getWebviewViewManager();
    }

    cmd_refresh() {
        this.refresh();
    }

    async cmd_revealItem(item: GitTreeItemGroup|GitTreeItemFile) {
        await this.getTreeViewManager().reveal(item);
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
            this.getGitGroupManager().cache_save();
            this.getTreeViewManager().setTag(this.getGitGroupManager().group_lists().length);
            this.refresh();
        }
    }

    cmd_deleteGroup(item: GitTreeItemGroup) {
        try {
            this.getGitGroupManager().group_deleteByName(item.label);
            this.getTreeViewManager().setTag(this.getGitGroupManager().group_lists().length);
            this.getGitGroupManager().cache_save();
            this.refresh();
        } catch (e) {
            vscode.window.showErrorMessage(`删除分组失败:${e}`);
        }
    }

    cmd_activeGroup(item: GitTreeItemGroup) {
        try {
            this.getGitGroupManager().group_setActive(item.label);
            this.getGitGroupManager().cache_save();
            this.refresh();
        } catch (e) {
            vscode.window.showErrorMessage(`切换激活状态失败:${e}`);
        }
    }

    async cmd_renameGroup(item: GitTreeItemGroup) {
        try {
            const newName = await vscode.window.showInputBox({
                placeHolder: '输入新的分组名称并回车',
                value: item.label,
                validateInput: (value) => {
                    if (!value) return '名称不能为空';
                    if (value === item.label) return null;
                    if (this.getGitGroupManager().group_isExist(value)) return '分组名称已存在';
                    return null;
                }
            });

            if (newName) {
                this.getGitGroupManager().group_rename(item.label, newName);
                this.getGitGroupManager().cache_save();
                this.refresh();
            }
        } catch (e) {
            vscode.window.showErrorMessage(`重命名分组失败:${e}`);
        }
    }

    async cmd_exportFiles(item: GitTreeItemGroup | GitTreeItemFile) {
        try {

            await this.getGitGroupManager().export_files(item);

            
        } catch (e) {
            vscode.window.showErrorMessage(`导出文件失败:${e}`);
        }
    }

    async cmd_openChange(item: GitTreeItemFile) {
        try {

            this.getGitManager().openChange(item);
            
        } catch (e) {
            vscode.window.showErrorMessage(`打开更改失败:${e}`);
        }
    }
  
}