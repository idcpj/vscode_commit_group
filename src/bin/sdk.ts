import { Repository } from "../@type/git";
import { GitFileProvider } from "../lib/GitFileProvider";
import { GitGroupManager as GroupManager } from "../lib/GroupManager";
import * as vscode from 'vscode';
import { GitManager } from "../lib/GitManager";
import { Callback, SdkType } from "../@type/type";
import { GitFileTreeDrop } from "../lib/GitFileTreeDrop";
import { GitTreeItemGroup } from "../lib/data/GitTreeItemGroup";
import { GitTreeItemFile } from "../lib/data/GitTreeItemFile";
import { TreeViewManager } from "../lib/TreeViewManager";
import { WebviewViewManager } from "../lib/WebviewViewManager";
import { GitGroupName_Other } from "../const";



export class Sdk implements SdkType {

    private workspaceRoot: string;
    private gitFileProvider: GitFileProvider;
    private groupManager: GroupManager;
    private gitManager: GitManager;
    private context: vscode.ExtensionContext;
    private gitFileTreeDrop: GitFileTreeDrop;
    private treeViewManager: TreeViewManager;
    private webviewViewManager: WebviewViewManager;

    // private isRun=false;
    private afterRunFn: Callback | undefined;

    constructor(workspaceRoot: string, context: vscode.ExtensionContext) {
        this.workspaceRoot = workspaceRoot;

        this.context = context;
        this.groupManager = new GroupManager(this);
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

    public getGroupManager() {
        return this.groupManager;
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
        
        this.getTreeViewManager().setTag(0);
        this.getWebviewViewManager().reload().then(()=>{
            this.getGitFileProvider().refresh();
        })
        
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
            placeHolder: vscode.l10n.t('Enter Group Name And Press Enter'),
            validateInput: (value) => {
                if (!value) return vscode.l10n.t('Name Cannot Be Empty');
                if (this.getGroupManager().group_isExist(value)) return vscode.l10n.t('Group Name Exists');
                return null;
            }
        });

        if (groupName) {
            this.getGroupManager().group_add(GitGroupName_Other,groupName);
            this.getGroupManager().cache_save();
            this.getTreeViewManager().setTag(this.getGroupManager().group_lists().length);
            this.refresh();
        }
    }

    cmd_deleteGroup(item: GitTreeItemGroup) {
        try {
            this.getGroupManager().group_deleteByName(item.getLabel());
            this.getTreeViewManager().setTag(this.getGroupManager().group_lists().length);
            this.getGroupManager().cache_save();
            this.refresh();
        } catch (e) {
            vscode.window.showErrorMessage(vscode.l10n.t('Delete Group Failed'));
        }
    }

    cmd_activeGroup(item: GitTreeItemGroup) {
        try {
            this.getGroupManager().group_setActive(item.getLabel());
            this.getGroupManager().cache_save();
            this.refresh();
        } catch (e) {
            vscode.window.showErrorMessage(vscode.l10n.t('Switch Active State Failed'));
        }
    }

    async cmd_renameGroup(item: GitTreeItemGroup) {
        try {
            const newName = await vscode.window.showInputBox({
                placeHolder: vscode.l10n.t('Enter Group Name And Press Enter.rename'),
                value: item.getLabel(),
                validateInput: (value) => {
                    if (!value) return vscode.l10n.t('Name Cannot Be Empty');
                    if (value === item.getLabel()) return null;
                    if (this.getGroupManager().group_isExist(value)) return vscode.l10n.t('Group Name Exists');
                    return null;
                }
            });

            if (newName) {
                this.getGroupManager().group_rename(item.getLabel(), newName);
                this.getGroupManager().cache_save();
                this.refresh();
            }
        } catch (e) {
            vscode.window.showErrorMessage(vscode.l10n.t('Rename Group Failed'));
        }
    }

    async cmd_exportFiles(item: GitTreeItemGroup | GitTreeItemFile) {
        try {

            await this.getGroupManager().files_export(item);

            
        } catch (e) {
            vscode.window.showErrorMessage(vscode.l10n.t('Export Files Failed {0}', e as string));
        }
    }

    async cmd_openChange(item: GitTreeItemFile) {
        try {

            this.getGitManager().openChange(item);
            
        } catch (e) {
            vscode.window.showErrorMessage(vscode.l10n.t('Open Changes Failed'));
        }
    }

    async cmd_moveToGroup() {
        try {
            // 获取选中的文件列表
            const fileList = this.getTreeViewManager().getSelectedFileListMultiGroup();
            if (fileList.length === 0) {
                throw new Error(vscode.l10n.t('No Files Selected'));
            }
            
            // 获取文件所在的分组
            const groups = this.getGroupManager().group_getByFilePaths(fileList);
         

            // 获取可移动的目标分组列表
            const targetGroups = this.getGroupManager().group_filterGroup(groups);
            
            // 显示分组选择弹窗
            const selected = await vscode.window.showQuickPick(
                targetGroups.map(group => ({
                    label: group.getLabel(),
                    group: group
                })),
                {
                    placeHolder: vscode.l10n.t('Select Target Group')
                }
            );

            if (selected) {
                // 移动文件到目标分组
                this.getGroupManager().file_move(fileList, selected.group);
                this.getGroupManager().cache_save();
                this.refresh();
            }

        } catch (e:any) {
            console.log(e);
            vscode.window.showErrorMessage(vscode.l10n.t('Move Files Failed {0}', e.toString()));
        }
    }
}