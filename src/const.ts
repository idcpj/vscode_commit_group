import { l10n } from 'vscode';

// export const GitGroupName_Working = l10n.t('Default');
// export const GitGroupName_Untracked = l10n.t('Untracked Files');
// export const GitGroupName_Staged = l10n.t('Temporary Cache');

export type GroupNameType= number

export const GitGroupName_Untracked: GroupNameType = 0; // 未跟踪分组
export const GitGroupName_Working: GroupNameType = 1; // 默认分组
export const GitGroupName_Staged: GroupNameType = 2; // 暂存区分组[未启用]
export const GitGroupName_Other: GroupNameType = 10; // 其他类型


export function getGroupNameByType(index: GroupNameType): string {
    const name = <Record<GroupNameType, string>>{
        [GitGroupName_Untracked]: l10n.t('Untracked Files'),
        [GitGroupName_Working]: l10n.t('Default'),
        [GitGroupName_Staged]: l10n.t('Temporary Cache'),
    }
    return name[index];
}




