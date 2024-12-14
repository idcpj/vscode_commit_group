import { API, Change, GitExtension, Repository, Status } from "../@type/git";
import { Sdk } from "../bin/sdk";
import { GitGroupName_Untracked, GitGroupName_Working } from "../const";
import { sleep } from "../help/time";
import * as vscode from 'vscode';
import { GitTreeItemFile } from "./data/GitTreeItemFile";


export class GitManager {

    private gitExtension: vscode.Extension<GitExtension> | undefined;
    private git: API | undefined;
    private repository: Repository | undefined;
    private sdk: Sdk;

    constructor(sdk: Sdk) {
        this.sdk = sdk;

        this.gitExtension = vscode.extensions.getExtension('vscode.git') as vscode.Extension<GitExtension>;
    }

    public async getRepository() {
        if (!this.repository) {
            await this.load();
            if (!this.repository) {
                throw new Error('No repository found');
            }
        }

        return this.repository;
    }

    private getGitExtension() {
        if (!this.gitExtension) {
            throw new Error('Git extension not found');
        }
        return this.gitExtension;
    }


    private async load() {

        await this.getGitExtension().activate();
        if (!this.getGitExtension().isActive) {
            throw new Error('Git extension not found');
        }

        this.git = this.getGitExtension().exports.getAPI(1);

        await sleep(1000);

        this.repository = this.git.repositories[0];

    }

    public async run() {

        // 增强 Git 变化监听
        const gitExtension = this.getGitExtension();
        if (gitExtension) {
            gitExtension.activate().then(async git => {

                if (!git) {
                    return;
                }

                await sleep(1000);

                const repository = git.getAPI(1).repositories[0];
                if (!repository) {
                    return;
                }

                // 监听 Git 状态变化
                repository.state.onDidChange(() => {
                    this.loadFileList();
                    this.sdk.refresh();
                });


            });
        }
    }



    public async loadFileList() {
        const repository = await this.sdk.getGitManager().getRepository();

        const oldFiles:GitTreeItemFile[] =Object.assign([],this.sdk.getGitGroupManager().file_lists());
        const needRemoveFiles:string[] = [];

        // 未跟踪的文件变更
        for (const change of repository.state.untrackedChanges) {

            needRemoveFiles.push(change.uri.fsPath);

            this.addFile(GitGroupName_Untracked, change);
        }


        // 暂存区的文件变更
        for (const change of repository.state.indexChanges) {
            needRemoveFiles.push(change.uri.fsPath);
            this.addFile(GitGroupName_Working, change);
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
                    this.addFile(GitGroupName_Working, change);
                    break;
                case Status.UNTRACKED:

                    // 忽略 .gitignore 文件,无需执行,自动忽略
                    // const ignoreFile = await repository.checkIgnore([change.uri.fsPath])
                    // if (ignoreFile.size > 0) {
                    //     break;
                    // }
                    

                    this.addFile(GitGroupName_Untracked, change);

                    break;
                default:
                    // nothing
                    break;
            }
        }

        oldFiles.forEach(file => {
            if(!needRemoveFiles.includes(file.getFilePath())){
                this.sdk.getGitGroupManager().file_moveByPath(file.getFilePath());
            }
        });

    }

    public addFile(groupName: string, change: Change) {

        // 判断文件是否存在
        const oldFile = this.sdk.getGitGroupManager().file_getByPath(change.uri.fsPath);
        if (oldFile) {
            
            // 状态一样无需处理
            if(oldFile.getChange()?.status===change.status){
                return;
            }


            // change  不存在,说明是从 cache 中获取,只需要绑定 status
            if(oldFile.getChange()?.status===undefined){
                oldFile.setChange(change);
                return;
            }


            // 删除旧文件
            this.sdk.getGitGroupManager().file_moveByPath(oldFile.getFilePath());
        }

        // 添加文件到指定分组
        if(groupName===GitGroupName_Untracked){
            this.sdk.getGitGroupManager().file_add(GitGroupName_Untracked, change);
        }else{
            this.sdk.getGitGroupManager().file_addInActiveGroup(groupName, change);
        }

        // console.log("this.sdk.getGitGroupManager().getGroups()",this.sdk.getGitGroupManager().getGroups());

        
    }

    public async getChangeByFilePath(filepath:string){
        const repository = await this.getRepository();
        let file = repository.state.indexChanges.find(f => f.uri.fsPath === filepath);
        if(file){
            return file;
        }
        file = repository.state.workingTreeChanges.find(f => f.uri.fsPath === filepath);
        if(file){
            return file;
        }
        file = repository.state.untrackedChanges.find(f => f.uri.fsPath === filepath);
        if(file){
            return file;
        }
        throw new Error(`file ${filepath} not found`);
    }


}