import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd'
	});

	const testsRoot = path.resolve(__dirname, '..');
	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }).then((files) => {

			// 使用 glob.glob 返回 Promise

			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		}).catch(err => {
			return e(err);
		});


	});
}