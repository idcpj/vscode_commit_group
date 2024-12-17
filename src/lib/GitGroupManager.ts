import { Change, Status } from "../@type/git";
import { GitGroupName_Untracked, GitGroupName_Working } from "../const";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";
import { GitTreeItemFileJson, GitTreeItemGroupJson, SdkType } from "../@type/type";
import * as vscode from 'vscode';
import { formatDate } from "../help/time";

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

    public group_getActive(): GitTreeItemGroup  {
         const group = this.groups.find(group => group.active);
         if(!group){
            throw new Error(vscode.l10n.t('No Active Group'));
         }
         return group;
    }

    public group_isExist(groupName: string): boolean {
        return this.group_groupNamebyName(groupName) ? true : false;
    }

    /**
     * 删除指定id的group
     * @param id group的id
     */
    public group_deleteByName(name: string): void {
        if (name === GitGroupName_Working || name === GitGroupName_Untracked) {
            throw new Error(vscode.l10n.t('Cannot Delete Built In Group'));
        }

        // 判断要删除的是否为激活的group
        const group = this.groups.find(group => group.label === name);
        if (group?.files && group?.files.length > 0) {
            throw new Error(vscode.l10n.t('Group Not Empty'));
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
            throw new Error(vscode.l10n.t('Group Name Exists With Name: {0}', name));
        }


        // 创建新group
        const newGroup: GitTreeItemGroup = new GitTreeItemGroup(name, isActive);

        // 添加到groups中
        this.groups.push(newGroup);


    }

    public group_rename(oldName: string, newName: string): void {
        if (oldName === GitGroupName_Untracked) {
            throw new Error(vscode.l10n.t('Cannot Rename Built In Group'));
        }

        // 名字唯一
        if (this.group_isExist(newName)) {
            throw new Error(vscode.l10n.t('Group Name Exists With Name: {0}', newName));
        }

        const group = this.group_groupNamebyName(oldName);
        if (!group) {
            throw new Error(vscode.l10n.t('Group Not Found {0}', oldName));
        }

        group.setLabel(newName);

      
    }

    public file_lists(): GitTreeItemFile[] {
        return Object.values(this.fileList);
    }

    public  file_move(fileList: string[], targetGroup: GitTreeItemGroup) {


        for (const file of fileList) {
            const fileItem = this.fileList[file];
            if (fileItem) {
                const group = fileItem.getGroup();

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
            console.error(vscode.l10n.t('Group Not Found {0}', groupName));
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

        if (change) {
            this.file_add(activeGroup.label, change);
            return
        }

        const file = this.sdk.getGitManager().getChangeByFilePath(filePath);
        if (file) {
            this.file_add(activeGroup.label, file);
        }


    }

    public file_getAcitveGroupFileList(): string[] {
        const activeGroup = this.group_getActive();
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
            throw new Error(vscode.l10n.t('No Files To Export'));
        }

        // 选择导出目录
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: vscode.l10n.t('Select Export Directory'),
            defaultUri: vscode.Uri.file(`${process.env.HOME || process.env.USERPROFILE}/Desktop`)
        });

        if (!folderUri || folderUri.length == 0) {
            throw new Error(vscode.l10n.t('No Export Directory Selected'));
        }

        // 创建时间戳目录
        const timestamp = formatDate(new Date(), 'YYYY-MM-DD_HH-mm-ss');

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
                await vscode.workspace.fs.copy(sourceUri, targetUri);
            } catch (err) {
                console.error(`Failed to copy file ${filePath}:`, err);
            }
        }

        vscode.window.showInformationMessage(
            vscode.l10n.t('Export {0} Files To {1}', files.length, exportRoot.fsPath),
            vscode.l10n.t('Open Directory')
        ).then(selection => {
            if (selection === '打开目录') {
                vscode.commands.executeCommand('revealFileInOS', exportRoot);
            }
        });
    }


    // 加载缓存数据,或创建数据
    public relaod() {
        // 调试用
        // this.cache_clear();

        this.groups = this.cache_get_groups();
        if (this.groups.length == 0) {
            this.group_add(GitGroupName_Working,/* isActive */true);
            this.group_add(GitGroupName_Untracked,/* isActive */false);
        }

        // 加载文件列表
        this.cache_get_fileList()?.forEach( (file: GitTreeItemFileJson) => {

            const change = this.sdk.getGitManager().getChangeByFilePath(file.filepath);
            if (!change) {
                console.log(vscode.l10n.t('File Not Found {0}', file.filepath));
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
            const data = JSON.parse(fileList) as GitTreeItemFileJson[];
            return data;
        }

        return []
    }

    public cache_set_groups() {
        this.sdk.getContext().workspaceState.update('commit-group.groups', JSON.stringify(this.groups.map(group => group.toJson())));
    }

    public cache_set_fileList() {
        const fileList = Object.values(this.fileList).map(file => file.toJson());
        this.sdk.getContext().workspaceState.update('commit-group.fileList', JSON.stringify(fileList));
    }

    public cache_clear() {
        this.sdk.getContext().workspaceState.update('commit-group.groups', '');
        this.sdk.getContext().workspaceState.update('commit-group.fileList', '');
    }



}
