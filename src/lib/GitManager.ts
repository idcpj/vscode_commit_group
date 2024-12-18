import { API, Change, GitExtension, Repository, Status } from "../@type/git";
import { Sdk } from "../bin/sdk";
import { getGroupNameByType, GitGroupName_Untracked, GitGroupName_Working } from "../const";
import { sleep } from "../help/time";
import * as vscode from 'vscode';
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import { Callback } from "../@type/type";


export class GitManager {

    private gitExtension: vscode.Extension<GitExtension> | undefined;
    private git: API | undefined;
    private repository: Repository | undefined;
    private sdk: Sdk;
    // private sourceProvider: vscode.TextDocumentContentProvider;

    constructor(sdk: Sdk) {
        this.sdk = sdk;

        this.gitExtension = vscode.extensions.getExtension('vscode.git') as vscode.Extension<GitExtension>;
        // console.log("this.gitExtension ====",this.gitExtension);
        // console.log("this.gitExtension ====",this.gitExtension.exports.enabled);

        // // 创建 Virtual Documents Provider
        // this.sourceProvider = new class implements vscode.TextDocumentContentProvider {
        //     onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
        //     onDidChange = this.onDidChangeEmitter.event;

        //     async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        //         const repository = sdk.getGitManager().repository;
        //         if (!repository) {
        //             return '';
        //         }
        //         // 获取原始文件内容
        //         return await repository.show(uri.path) || '';
        //     }
        // };

        // // 注册 Virtual Documents Provider
        // sdk.getContext().subscriptions.push(
        //     vscode.workspace.registerTextDocumentContentProvider('git-original', this.sourceProvider)
        // );
    }

    public getRepository() {
        if (!this.repository) {
            throw new Error(vscode.l10n.t('Workspace Not Initialized As Git'));
        }

        return this.repository;
    }

    public isActive(){
        return this.repository?true:false;
    }


    public async run(fn:Callback|undefined) {

        // 增强 Git 变化监听
        const gitExtension = this.gitExtension;
        if (!gitExtension) {
            vscode.window.showErrorMessage(vscode.l10n.t('Git Extension Not Active'));
            return;
        }


        // 如果是监听到激活
        gitExtension.activate().then((git:GitExtension) => {
            // vscode.window.showInformationMessage("触发激活");
            this.listenChange(git,fn);
        });

        // fix:如果新安装的插件,git 已经初始化完成,则直接使用这个
        if(gitExtension.isActive){
            // vscode.window.showInformationMessage("Git 已激活");
            this.repository=gitExtension.exports.getAPI(1).repositories[0];
            this.listenChange(gitExtension.exports,fn);
            
             // 监听 Git 状态变化
            this.repository.state.onDidChange(async () => {
                // vscode.window.showInformationMessage("Git 状态变化");
                this.sdk.refresh();
            });

            fn?.();
        }
      

    }

    private listenChange(git:GitExtension,fn:Callback|undefined){
        if (!git) {
            vscode.window.showErrorMessage(vscode.l10n.t('Git Extension Not Found'));
            return;
        }
        const gitSelf = git.getAPI(1);

        // 监听 git  是否初始化
        gitSelf.onDidOpenRepository((repository: Repository) => {

            this.repository=repository;

            // 监听 Git 状态变化
            repository.state.onDidChange(async () => {
                // vscode.window.showInformationMessage("Git 状态变化");
                this.sdk.refresh();
            });

            fn?.();
        })

        // 监听 git 关闭
        gitSelf.onDidCloseRepository((repository: Repository) => {
            this.repository=undefined;
            this.sdk.refresh();
        })

    }




    public async loadFileList() {
        const repository =  this.sdk.getGitManager().getRepository();
        const acitveGroupName = this.sdk.getGitGroupManager().group_getActive()?.getLabel();
 

        const oldFiles: GitTreeItemFile[] = Object.assign([], this.sdk.getGitGroupManager().file_lists());
        const needRemoveFiles: string[] = [];

        const untrackedGroupName = this.sdk.getGitGroupManager().group_getByType(GitGroupName_Untracked)?.getLabel()||getGroupNameByType(GitGroupName_Untracked);

        // 未跟踪的文件变更
        for (const change of repository.state.untrackedChanges) {
            needRemoveFiles.push(change.uri.fsPath);
            this._addFile(untrackedGroupName, change);
        }


        // 暂存区的文变更
        for (const change of repository.state.indexChanges) {
            // console.log("change.uri.fsPath ", change.uri.fsPath);
            needRemoveFiles.push(change.uri.fsPath);
            this._addFile(acitveGroupName, change);
        }

        // 如果是修改后又还原的文件,不在所有的 repository.state 中,进行移除
        // 处理工作区更改
        for (const change of repository.state.workingTreeChanges) {
            // console.log("workingTreeChanges change", change.uri.fsPath);


            needRemoveFiles.push(change.uri.fsPath);

            switch (change.status) {
                case Status.MODIFIED:
                case Status.DELETED:
                case Status.INTENT_TO_ADD:
                case Status.TYPE_CHANGED:
                    // console.log("change.uri.fsPath workingTreeChanges ", change.uri.fsPath);

                    this._addFile(acitveGroupName, change);
                    break;
                case Status.UNTRACKED:

                    this._addFile(untrackedGroupName, change);

                    break;
                default:
                    // nothing
                    console.error(`file=${change.uri.fsPath}  status=${change.status}`);
                    break;
            }
        }

        // 修改后又还原的,则需要删除
        oldFiles.forEach(file => {
            if (!needRemoveFiles.includes(file.getFilePath())) {
                this.sdk.getGitGroupManager().file_moveByPath(file.getFilePath());
            }
        });

    }

    private _addFile(groupName: string, change: Change) {

        // 判断文件是否存在
        const oldFile = this.sdk.getGitGroupManager().file_getByPath(change.uri.fsPath);
        if (oldFile) {

            // 状态一样无需处理
            if (oldFile.getChange()?.status === change.status) {
                return;
            }


            // change  不存在,说明是从 cache 中获取,只需要绑定 status
            if (oldFile.getChange()?.status === undefined) {
                oldFile.setChange(change);
                return;
            }

            // 只要这个值存在,就不需要处理
            return;
        }


        // 添加文件到指定分组
        if (groupName !== "") {
            this.sdk.getGitGroupManager().file_add(groupName, change);
        } else {
            this.sdk.getGitGroupManager().file_addInActiveGroup(change.uri.fsPath, change);
        }

        // console.log("this.sdk.getGitGroupManager().getGroups()",this.sdk.getGitGroupManager().getGroups());


    }

    public  getChangeByFilePath(filepath: string): Change | undefined {
        const repository = this.getRepository();
        let file = repository.state.indexChanges.find(f => f.uri.fsPath === filepath);
        if (file) {
            return file;
        }
        file = repository.state.workingTreeChanges.find(f => f.uri.fsPath === filepath);
        if (file) {
            return file;
        }
        file = repository.state.untrackedChanges.find(f => f.uri.fsPath === filepath);
        if (file) {
            return file;
        }
        return undefined;
    }

    /**
     * 提交指定文件
     * @param pathList 
     * @param message 
     */
    public async commitByPathList(pathList: string[], message: string) {
        const repository =  this.getRepository();
        // 取消 git add 其他文件
        // 如果是 索引的,则变成未索引
        const waithandle:string[]=[];
        this.sdk.getGitGroupManager().file_lists().forEach(async f=>{
            if(f.getChange()?.status!=Status.UNTRACKED){
                waithandle.push(f.getFilePath())
            }
        })

        if(waithandle.length>0){
            await repository.revert(waithandle);
        }

        // 只对指定文件进行 git add
        await repository.add(pathList);
        await repository.commit(message);
    }

    public async openChange(item: GitTreeItemFile) {
        const change = item.getChange();
        if (!change) {
            throw new Error(vscode.l10n.t('No Changes'));
        }

        const uri = item.resourceUri;
        if (uri) {

            const repository = this.getRepository();
            const originalContent = await repository.show("HEAD", change.uri.fsPath);

            vscode.commands.executeCommand("vscode.diff", vscode.Uri.file(originalContent), vscode.Uri.file(uri.fsPath), "Comparing Files");


            // 使用自定义 scheme 创建原始文件的 Uri
            // const originalUri = vscode.Uri.parse('git-original:' + uri.path);

            // // 打开差异视图
            // await vscode.commands.executeCommand('vscode.diff',
            //     originalUri,     // 原始文件 (Virtual Document)
            //     uri,            // 当前文件
            //     `${vscode.workspace.asRelativePath(uri.fsPath)} (更改)`
            // );
        }
    }

    

}