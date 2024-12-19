import * as vscode from 'vscode';
import { SdkType } from '../@type/type';
import { l10n } from 'vscode';


// 创建一个新的 WebviewViewProvider
export class WebviewViewManager implements vscode.WebviewViewProvider {
    private sdk: SdkType;
    private webviewView: vscode.WebviewView | undefined;

    constructor(sdk: SdkType) {
        this.sdk = sdk;
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        try {
            this.webviewView = webviewView;

            // 设置 webview 选项
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [
                    this.sdk.getContext().extensionUri // 允许访问扩展目录
                ]
            };

            await this.reload();

            // 注册消息处理
            this.registerMessageHandler(webviewView);

        } catch (error) {
            console.error('Failed to resolve webview:', error);
            throw error; // 让 VS Code 知道发生了错误
        }
    }

    async reload() {
        if (!this.webviewView) {
            return;
        }

        try {
            if (!this.sdk.getGitManager().isActive()) {
                this.webviewView.webview.html = this.renderEmptyHtml();
                return;
            }


            // 获取 HTML 文件路径
            const htmlPath = vscode.Uri.joinPath(
                this.sdk.getContext().extensionUri,
                'resources', 'html', 'index.html'
            );

            // 读取 HTML 内容
            const htmlContent = await vscode.workspace.fs.readFile(htmlPath);
            let html = Buffer.from(htmlContent).toString('utf-8');

            // 替换占位符
            const translations = {
                commit: vscode.l10n.t('Commit'),
                tips: vscode.l10n.t('if you have any questions, please'),
                commitMessage: vscode.l10n.t('Enter Git Commit Message'),
                issues: vscode.l10n.t('issues')
            };

            // 替换所有翻译占位符
            Object.entries(translations).forEach(([key, value]) => {
                html = html.replace(`__${key}__`, value);
            });

            // 设置 webview HTML
            this.webviewView.webview.html = html;

        } catch (error) {
            console.error('Failed to reload webview:', error);
            // 显示错误信息
            this.webviewView.webview.html = this.renderErrorHtml(error);
        }
    }

    private renderErrorHtml(error: any): string {
        return `
            <!DOCTYPE html>
            <html>
                <body>
                    <div style="color: red; padding: 10px;">
                        ${vscode.l10n.t('Failed to load view: {0}', error.message)}
                    </div>
                </body>
            </html>
        `;
    }

    private registerMessageHandler(webviewView: vscode.WebviewView) {
        webviewView.webview.onDidReceiveMessage(async data => {
            try {
                if (data.type === "commit") {

                    if (data.message.length == 0) {
                        throw new Error(vscode.l10n.t('Commit Message Cannot Be Empty'));
                    }

                    if (this.sdk.getTreeViewManager().selectIsUnTracked()) {
                        throw new Error(vscode.l10n.t('Cannot Commit Untracked Group'));
                    }

                    let fileList: string[] = [];


                    // 如果选中分组,则只检测分组,没选中则使用默认
                    if (this.sdk.getTreeViewManager().isSelectGroup() || this.sdk.getTreeViewManager().isSelectFile()) {
                        fileList = this.sdk.getTreeViewManager().getSelectedFileList();
                    } else {
                        fileList = this.sdk.getGroupManager().file_getAcitveGroupFileList();
                    }

                    if (fileList.length == 0) {
                        throw new Error(vscode.l10n.t('No Files Selected'));
                    }


                    await this.sdk.getGitManager().commitByPathList(fileList, data.message);


                    this.sdk.refresh();

                } else {
                    throw new Error(vscode.l10n.t('Invalid data type'));
                }
            } catch (e: any) {
                console.error('Message handler error:', e);
                vscode.window.showErrorMessage(
                    vscode.l10n.t('Commit Failed {0}', e.message),
                    vscode.l10n.t('Confirm')
                );
            }
        });
    }

    public setDescription(description: string) {
        if (this.webviewView) {
            this.webviewView.description = description;
        }
    }


    private renderEmptyHtml(): string {
        return `
        <div>
    ${l10n.t('Workspace Not Initialized As Git')}
</div>`
    }


}
