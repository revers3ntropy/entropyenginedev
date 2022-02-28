const fs = require("fs");
const p = require('path');
const minifyHTML = require('html-minifier').minify;
const performanceNow = require("performance-now");
const chalk = require("chalk");
const {run} = require("./utils");

const
	now = () => Math.round(performanceNow()),
	HEAD = fs.readFileSync('./nav.html'),
	FOOT = fs.readFileSync('./footer.html');

/**
 * @param {string} dir
 * @param {boolean} QUIET
 * @param {string} MAIN
 * @param {any} timings
 * @param {boolean} recursive
 * @param {boolean} types
 * @returns {Promise<number>} time taken to execute
 */
exports.buildHTML = async (dir, QUIET, MAIN, timings={}, recursive=true, types=true) => {
	const start = now();

	const paths = fs.readdirSync(p.join('./src/', dir));

	const distPath = p.join('./dist/public_html', dir);

	let html = '';
	let css = '';
	let js = '';

	let subDirTime = 0;

	if (paths.indexOf('index.html') === -1) {
		return now() - start - subDirTime;
	}

	if (!QUIET) console.log(`Building '${dir}'`);

	for (const path of paths) {
		if (path[path.length-1] === '~') {
			// is a backup file that will get deleted automatically by IDE
			continue;
		}
		const fullPath = p.join('./src', dir, path);

		if (fs.statSync(fullPath).isDirectory()) {
			if (recursive) {
				subDirTime += await exports.buildHTML(p.join(dir, path), QUIET, MAIN, timings, types);
			}
			continue;
		}

		if (path === 'index.html') {
			html = `
				${HEAD}
				${fs.readFileSync(fullPath)}
			`;

		} else if (path === 'index.less') {
			const start = now();
			await run (`lessc ${fullPath} ${distPath}/index.css > ./build/ts_less_log.txt`);
			if (!fs.existsSync(`${distPath}/index.css`)) {
				console.log(chalk.red`FILE '${distPath}/index.css' REQUIRED!`);
				throw new Error();
			}
			const fileContent = fs.readFileSync(`${distPath}/index.css`);
			fs.unlinkSync(`${distPath}/index.css`);

			css = '<style>' + fileContent + '</style>';
			timings['Compile LESS'] += now() - start;


		} else if (path === 'index.ts') {
			const start = now();

			const webpackConfigPath = p.join(p.resolve(p.dirname(fullPath)), 'webpack.config.js');
			const logPath = p.join(p.resolve(p.dirname(fullPath)), 'log.txt');

			fs.writeFileSync(logPath, '');

			fs.writeFileSync(webpackConfigPath, `
				const path = require('path');
				
				module.exports = {
					entry: '${p.resolve(fullPath)}',
					output: {
						filename: 'bundle.js',
						path: path.resolve(__dirname, ''),
					},
					mode: 'production',
					resolve: {
						extensions: ['.ts', '.js'],
					},
					module: {
						rules: [
							{
								test: /\\.ts$/,
								loader: 'ts-loader',
								options: {
									configFile: "${p.resolve('./tsconfig.json')}",
									allowTsInNodeModules: true,
									${types ? '' : 'transpileOnly: true'}
								}
							},
						]
					}
				};
			`);

			await run (`webpack --config ${webpackConfigPath} > ${logPath}`)
				.catch(e => {
					console.log(chalk.red`Failed to compile & bundle @ ${distPath}: \n`,
						fs.readFileSync(logPath).toString());

					if (!fs.readFileSync(logPath).toString()) {
						console.log('ERROR NOT FOUND. GENERATED ERROR: ', e);
						console.log('WEBPACK CONFIG: ');
						console.log(fs.readFileSync(webpackConfigPath).toString());
					}
					fs.unlinkSync(webpackConfigPath);
					fs.unlinkSync(logPath);
					throw new Error();
				});

			const bundlePath = p.join(p.dirname(fullPath), 'bundle.js');
			if (!fs.existsSync(bundlePath)) {
				console.log(chalk.red`FILE '${bundlePath}' REQUIRED!`);
				fs.unlinkSync(webpackConfigPath);
				fs.unlinkSync(logPath);
				throw new Error();
			}

			const fileContent = fs.readFileSync(bundlePath).toString();

			fs.unlinkSync(bundlePath);
			fs.unlinkSync(webpackConfigPath);
			fs.unlinkSync(logPath);

			if (fs.existsSync(p.join(p.dirname(fullPath), 'bundle.js.LICENSE.txt'))) {
				fs.rmSync(p.join(p.dirname(fullPath), 'bundle.js.LICENSE.txt'))
			}

			js = '<script defer>' + fileContent + '</script>';
			timings['Compile TS'] += now() - start;
		}
	}

	if (!fs.existsSync(distPath) && html) {
		fs.mkdirSync(distPath);
	}

	js = '<script defer>' + MAIN + '</script>' + js;

	const final = minifyHTML(html + css + js + FOOT, {
		removeAttributeQuotes: false,
		removeComments: true,
		removeRedundantAttributes: true,
		removeScriptTypeAttributes: false,
		sortClassName: true,
		useShortDoctype: true,
		collapseWhitespace: true
	});

	fs.writeFileSync(distPath + '/index.html', final);

	let time = now() - start - subDirTime;

	timings[`'${distPath}' front-end path`] = time;

	return time;
}