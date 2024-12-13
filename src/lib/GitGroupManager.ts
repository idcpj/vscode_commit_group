import { Change, GitExtension, Repository, Status } from "../@type/git";
import { sleep } from "../help/time";
import { GitGroupName_Untracked, GitGroupName_Working } from "../const";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";
import * as vscode from 'vscode';
import { SdkType } from "../@type/type";


export class GitGroupManager {
    private groups: GitTreeItemGroup[];
    private fileList: Record<string, GitTreeItemFile> = {};
    private sdk: SdkType;

    constructor(
        sdk: SdkType,
    ) {

        this.sdk = sdk;

        this.groups = sdk.getContext().workspaceState.get<GitTreeItemGroup[]>('commit-group.groups', []);

        // 加载文件列表
        sdk.getContext().workspaceState.get<GitTreeItemFile[]>('commit-group.fileList', []).forEach((file: GitTreeItemFile) => {
            this.fileList[file.getFilePath()] = file;
        });
    }

    public getGroups(): GitTreeItemGroup[] {

        // 未跟踪的分组排最后,激活的分组排最前
        return this.groups.sort((a, b) => a.label === GitGroupName_Untracked ? 1 : b.label === GitGroupName_Untracked ? -1 : a.active ? -1 : b.active ? 1 : 0);
    }


    /**
     * 获取指定名称的group
     * @param name group的名称
     * @returns 指定名称的group
     */
    public getGroupByName(name: string): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.label === name);
    }

    /**
     * 激活指定id的group
     * @param name group的名称
     */
    public activeGroup(name: string): void {
        this.groups.forEach(group => {
            if (group.label === name) {
                group.checkActive();
            } else {
                group.uncheckActive();
            }
        });
    }
    public getActiveGroup(): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.active);
    }


    /**
     * 删除指定id的group
     * @param id group的id
     */
    public deleteGroup(name: string): void {
        //两种类型的不能删除
        if (name === GitGroupName_Working || name === GitGroupName_Untracked) {
            throw new Error('不能删除内置分组');
        }

        // 判断要删除的是否为激活的group
        const group = this.groups.find(group => group.label === name);
        if (group?.files && group?.files.length > 0) {
            throw new Error('group is not empty');
        }

        // 先过滤掉要删除的group
        this.groups = this.groups.filter(group => group.label !== name);

        // 如果删除的是激活的group,则激活order最小的group
        if (group?.active && this.groups.length > 0) {
            const minOrderGroup = this.groups.reduce((prev, curr) =>
                prev.order < curr.order ? prev : curr
            );
            this.activeGroup(minOrderGroup.label);
        }
    }

    /**
     * 添加新的group
     * @param name group的名称
     * @returns 新添加的group的id
     */
    public addGroup(name: string, isActive: boolean = false) {
        // 生成唯一id

        const id: string = name;

        // 名字唯一
        if (this.groupIsExist(name)) {
            throw new Error(`Group ${name} already exists`);
        }


        // 获取最大的order
        const maxOrder = this.groups.reduce((max, group) =>
            group.order > max ? group.order : max,
            0
        );

        // 创建新group
        const newGroup: GitTreeItemGroup = new GitTreeItemGroup(id, name, maxOrder + 1, isActive);

        // 添加到groups中
        this.groups.push(newGroup);

    }


    public async moveFile(fileList: string[], targetGroup: GitTreeItemGroup) {

        const repository = await this.sdk.getGitManager().getRepository();


        for (const file of fileList) {
            const fileItem = this.fileList[file];
            if (fileItem) {
                const group = fileItem.getGroup();

                if (group?.label == GitGroupName_Untracked) {
                    // 从未跟踪到跟踪, 添加跟踪
                    await repository.add([file]);
                } else {
                    // 从跟踪到未跟踪, 撤销跟踪
                    await repository.revert([file]);
                }
                group.removeFile(file);
                targetGroup.addFile(fileItem);
            }
        }

    }

    public groupIsExist(groupName: string): boolean {
        return this.getGroupByName(groupName) ? true : false;
    }

    public fileIsExist(filePath: string): boolean {
        return this.fileList[filePath] ? true : false;
    }

    public getFile(filePath: string): GitTreeItemFile | undefined {
        return this.fileList[filePath];
    }

    public removeFile(filePath: string): void {
        const group = this.getGroupByName(filePath);
        if (group) {
            group.removeFile(filePath);
        }

        delete this.fileList[filePath];
    }

    /**
     * 添加文件到指定分组
     * @param groupName 分组名称
     * @param change 文件变更
     */
    public addFile(groupName: string, change: Change) {
        const group = this.getGroupByName(groupName);
        if (!group) {
            console.error("group is null",groupName);
            return;
        }

        const file = new GitTreeItemFile(change, group);
        group.addFile(file);
        this.fileList[change.uri.fsPath] = file;
    }


    public async addFileInActiveGroup(filePath: string) {
        const activeGroup = this.getActiveGroup();
        if (!activeGroup) {
            console.error("activeGroup is null");
            return;
        }

        const repository = await this.sdk.getGitManager().getRepository();
        const file = repository.state.indexChanges.find(f => f.uri.fsPath === filePath);
        if (file) {
            this.addFile(activeGroup.label, file);
        }

    }


    public relaod() {
        if (this.groups.length > 0) {
            this.groups = [];
            this.fileList = {};
        }

        
        this.addGroup(GitGroupName_Working,/* isActive */true);
        this.addGroup(GitGroupName_Untracked,/* isActive */false);


    }

    

}
