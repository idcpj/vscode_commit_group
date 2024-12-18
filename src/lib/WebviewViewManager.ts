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

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {

        this.webviewView = webviewView;

        webviewView.webview.options = {
            enableScripts: true
        };

        this.reload();


        webviewView.webview.onDidReceiveMessage(async data => {
            try {

                if (data.type === "commit") {

                    if(data.message.length==0){
                        throw new Error(vscode.l10n.t('Commit Message Cannot Be Empty'));
                    }

                    if(this.sdk.getTreeViewManager().selectIsUnTracked()){
                        throw new Error(vscode.l10n.t('Cannot Commit Untracked Group'));
                    }

                    let fileList: string[] = [];

                  
                    // 如果选中分组,则只检测分组,没选中则使用默认
                    if (this.sdk.getTreeViewManager().isSelectGroup() || this.sdk.getTreeViewManager().isSelectFile()) {
                        fileList = this.sdk.getTreeViewManager().getSelectedFileList();
                    } else {
                        fileList = this.sdk.getGitGroupManager().file_getAcitveGroupFileList();
                    }

                    if (fileList.length == 0) {
                        throw new Error(vscode.l10n.t('No Files Selected'));
                    }


                    await this.sdk.getGitManager().commitByPathList(fileList,data.message);
                    this.sdk.refresh();
                }
            } catch (e: any) {
                vscode.window.showErrorMessage(vscode.l10n.t('Commit Failed {0}', e.message), vscode.l10n.t('Confirm'));
            }
        });


    }

    reload(){
        if(!this.webviewView){
            return;
        }

        if(!this.sdk.getGitManager().isActive()){
            this.webviewView!.webview.html = this.renderEmptyHtml();
            return;
        }

        this.webviewView!.webview.html = this.renderHtml();
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
            </div>
        `;
    }


    private renderHtml() {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <style>
                        #commitMessage{
                            width: 99%;
                            height: 24px;
                            background: #3C3C3C;
                            color: #CCCCCC;
                            border: 1px solid #3C3C3C;
                            margin-bottom: 8px;
                            outline: none;
                        }

                        #commitButton{
                            background: #0E639C;
                            color: white;
                            border: none;
                            cursor: pointer;
                            font-size: 13px;
                            width: 100%;
                            height: 24px;
                        }
                        #commitButton:hover{
                            background: #026ec1;
                        }
                            
                        .tips{
                            color: #888888;
                            font-size: 13px;
                            margin-top: 8px;
                        }
                        .tips-buttom{
                            margin-top: 12px;
                        }
                    </style>
                </head>
                <body>
                    
                    <input type="text" id="commitMessage" placeholder="${l10n.t('Enter Git Commit Message')}"  >

                    <button id="commitButton">${l10n.t('Commit')}</button>

                    <div class="tips">
                         <div class="tips-buttom">
                            ${l10n.t('if you have any questions, please')}<a href="https://github.com/idcpj/vscode_commit_group/issues"> ${l10n.t('issues')}</a>
                        </div>
                    </div>

                   

                    <script>
                        const vscode = acquireVsCodeApi();
                        
                        document.getElementById('commitMessage').addEventListener('keyup', (e) => {
                            if (e.key === 'Enter') {
                                vscode.postMessage({ 
                                    type: 'commit',
                                    message: e.target.value 
                                });
                                e.target.value = '';
                            }
                        });
                        
                        document.getElementById('commitButton').addEventListener('click', (e) => {
                            const message = document.getElementById('commitMessage');
                            if(!message){
                                return;
                            }
                            vscode.postMessage({ 
                                type: 'commit',
                                message: message.value
                            });
                           message.value = '';
                        });
                    </script>
                </body>
            </html>
        `
    }
}
