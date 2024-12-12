import * as assert from 'assert';
import { before, describe, it } from 'mocha';
import * as vscode from 'vscode';

describe('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('开始运行测试!');
	});

	it('示例测试用例', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));

	});
});