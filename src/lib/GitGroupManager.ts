import { Change } from "../@type/git";
import { GitGroupName_Untracked, GitGroupName_Working } from "../const";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";
import { GitTreeItemFileJson, GitTreeItemGroupJson, SdkType } from "../@type/type";
import * as vscode from 'vscode';

export class GitGroupManager {
    private groups: GitTreeItemGroup[] = [];
    private fileList: Record<string, GitTreeItemFile> = {};
    private sdk: SdkType;

    constructor(
        sdk: SdkType,
    ) {

        this.sdk = sdk;
    }

    public group_lists(): GitTreeItemGroup[] {
        // 未跟踪的分组排最后,激活的分组排最前
        return this.groups.sort((a, b) => a.label === GitGroupName_Untracked ? 1 : b.label === GitGroupName_Untracked ? -1 : a.active ? -1 : b.active ? 1 : 0);
    }


    /**
     * 获取指定名称的group
     * @param name group的名称
     * @returns 指定名称的group
     */
    public group_groupNamebyName(name: string): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.label === name);
    }


    /**
     * 激活指定id的group
     * @param name group的名称
     */
    public group_setActive(name: string): void {
        this.groups.forEach(group => {
            if (group.label === name) {
                group.checkActive();
            } else {
                group.uncheckActive();
            }
        });

    }

    public group_getActive(): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.active);
    }

    public group_isExist(groupName: string): boolean {
        return this.group_groupNamebyName(groupName) ? true : false;
    }

    /**
     * 删除指定id的group
     * @param id group的id
     */
    public group_deleteByName(name: string): void {
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
            this.group_setActive(this.groups[0].label);
        }

    }

    /**
     * 添加新的group
     * @param name group的名称
     * @returns 新添加的group的id
     */
    public group_add(name: string, isActive: boolean = false) {

        // 名字唯一
        if (this.group_isExist(name)) {
            throw new Error(`Group ${name} already exists`);
        }


        // 创建新group
        const newGroup: GitTreeItemGroup = new GitTreeItemGroup(name, isActive);

        // 添加到groups中
        this.groups.push(newGroup);


    }

    public group_rename(oldName: string, newName: string): void {
        // 两种类型的不能重命名
        if (oldName === GitGroupName_Untracked) {
            throw new Error('不能重命名内置分组');
        }

        // 名字唯一
        if (this.group_isExist(newName)) {
            throw new Error(`分组 ${newName} 已存在`);
        }

        const group = this.group_groupNamebyName(oldName);
        if (!group) {
            throw new Error(`分组 ${oldName} 不存在`);
        }

        group.setLabel(newName);

        // 更新文件列表中的分组名称
        // group.getFileList().forEach(file => {
        //     file.setGroup(group);
        // });
    }

    public file_lists(): GitTreeItemFile[] {
        return Object.values(this.fileList);
    }

    public async file_move(fileList: string[], targetGroup: GitTreeItemGroup) {

        const repository = await this.sdk.getGitManager().getRepository();


        for (const file of fileList) {
            const fileItem = this.fileList[file];
            if (fileItem) {
                const group = fileItem.getGroup();

                // 源是没版本管理,目标是版本管理
                if (group?.label == GitGroupName_Untracked && targetGroup.label != GitGroupName_Untracked) {
                    await repository.add([file]);
                } else if (group?.label != GitGroupName_Untracked && targetGroup.label == GitGroupName_Untracked) {
                    await repository.revert([file]);
                }

                group.removeFile(file);
                targetGroup.addFile(fileItem);

            }
        }


    }



    public file_isExist(filePath: string): boolean {
        return this.fileList[filePath] ? true : false;
    }

    public file_getByPath(filePath: string): GitTreeItemFile | undefined {
        return this.fileList[filePath];
    }

    public file_moveByPath(filePath: string): void {
        const group = this.group_groupNamebyName(filePath);
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
    public file_add(groupName: string, change: Change) {
        const group = this.group_groupNamebyName(groupName) as GitTreeItemGroup;
        if (!group) {
            console.error("group is null", groupName);
            return;
        }

        const file = new GitTreeItemFile(change.uri.fsPath, group, change);
        // console.log("file_add", file.getGroup()?.label, file.getFilePath());


        group.addFile(file);
        this.fileList[change.uri.fsPath] = file;


    }


    /**
     * 在激活的group中添加文件
     * @param filePath 文件路径
     */
    public async file_addInActiveGroup(filePath: string, change?: Change) {
        const activeGroup = this.group_getActive();
        if (!activeGroup) {
            throw new Error("没有激活的分组");
        }

        if (change) {
            this.file_add(activeGroup.label, change);
            return
        }

        const file = await this.sdk.getGitManager().getChangeByFilePath(filePath);
        if (file) {
            this.file_add(activeGroup.label, file);
        }


    }

    public file_getAcitveGroupFileList(): string[] {
        const activeGroup = this.group_getActive();
        if (!activeGroup) {
            throw new Error("没有激活的分组");
        }
        return activeGroup.getFileList().map(file => file.getFilePath());
    }

    public async export_files(item: GitTreeItemGroup | GitTreeItemFile) {

        let files: string[] = [];
        let group_name = '';


        // 如果是分组,导出分组内所有文件
        if (item instanceof GitTreeItemGroup) {
            group_name = `_${item.label}`;
            files = item.getFileList().map(f => f.getFilePath());
        } else {
            // 获取选中的文件
            files = this.sdk.getTreeViewManager().getSelectedFileList();
        }

        if (files.length === 0) {
            throw new Error('没有可导出的文件');
        }

        // 选择导出目录
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: '选择导出目录',
            defaultUri: vscode.Uri.file(`${process.env.HOME || process.env.USERPROFILE}/Desktop`)
        });

        if (!folderUri || folderUri.length == 0) {
            throw new Error('没有选择导出目录');
        }

        // 创建时间戳目录
        // 2024-12-16 10:10:10
        const timestamp = new Date().toLocaleString('zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[/:]/g, '-');

        // 导出的绝对目录
        const exportRoot = vscode.Uri.joinPath(folderUri[0], `export${group_name}_${timestamp}`);

        // 创建根目录
        await vscode.workspace.fs.createDirectory(exportRoot);

        // 创建文件列表
        const fileListUri = vscode.Uri.joinPath(exportRoot, '_export_files.txt');
        await vscode.workspace.fs.writeFile(
            fileListUri,
            Buffer.from(files.map(file => vscode.workspace.asRelativePath(file)).join('\n'), 'utf8')
        );

        // 复制所有文件
        for (const filePath of files) {
            try {
                // 获取相对路径
                const relativePath = vscode.workspace.asRelativePath(filePath);
                // 构建目标路径
                const targetUri = vscode.Uri.joinPath(exportRoot, relativePath);
                // 确保目标目录存在
                await vscode.workspace.fs.createDirectory(
                    vscode.Uri.joinPath(targetUri, '..')
                );

                // 复制文件
                const sourceUri = vscode.Uri.file(filePath);
                const content = await vscode.workspace.fs.readFile(sourceUri);
                await vscode.workspace.fs.writeFile(targetUri, content);
            } catch (err) {
                console.error(`Failed to copy file ${filePath}:`, err);
            }
        }

        vscode.window.showInformationMessage(
            `成功导出 ${files.length} 个文件到 ${exportRoot.fsPath}`,
            '打开目录'
        ).then(selection => {
            if (selection === '打开目录') {
                vscode.commands.executeCommand('revealFileInOS', exportRoot);
            }
        });
    }

}


    // 加载缓存数据,或创建数据
    public relaod() {
    // 调试用

    this.groups = this.cache_get_groups();
    if (this.groups.length == 0) {
        this.group_add(GitGroupName_Working,/* isActive */true);
        this.group_add(GitGroupName_Untracked,/* isActive */false);
    }

    // 加载文件列表
    this.cache_get_fileList()?.forEach(async (file: GitTreeItemFileJson) => {

        const change = await this.sdk.getGitManager().getChangeByFilePath(file.filepath);
        if (!change) {
            console.error(`file ${file.filepath} not found`);
            return;
        }
        this.file_add(file.groupLabel, change);

    });



}

    public cache_save() {
    this.cache_set_groups();
    this.cache_set_fileList();
}

    public cache_get_groups(): GitTreeItemGroup[] {
    const groups = this.sdk.getContext().workspaceState.get<string>('commit-group.groups');
    if (groups) {
        return JSON.parse(groups).map((item: GitTreeItemGroupJson) => {
            return new GitTreeItemGroup(item.label, item.active);
        });
    }

    return []
}

    public cache_get_fileList(): GitTreeItemFileJson[] {
    const fileList = this.sdk.getContext().workspaceState.get<string>('commit-group.fileList');
    if (fileList) {
        return JSON.parse(fileList);
    }

    return []
}

    public cache_set_groups() {
    this.sdk.getContext().workspaceState.update('commit-group.groups', JSON.stringify(this.groups.map(group => group.toJson())));
}

    public cache_set_fileList() {
    this.sdk.getContext().workspaceState.update('commit-group.fileList', JSON.stringify(Object.values(this.fileList).map(file => file.toJson())));
}

    public cache_clear() {
    this.sdk.getContext().workspaceState.update('commit-group.groups', '');
    this.sdk.getContext().workspaceState.update('commit-group.fileList', '');
}



}
