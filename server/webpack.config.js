const path = require('path');

module.exports = {
	entry: './src/index.ts',
	output: {
		filename: 'index.js',
		path: path.join(path.resolve(__dirname), '../dist/server/'),
	},
	mode: 'production',
	node: {
		__dirname: false,
		__filename: false
	},
	target: 'node',
	resolve: {
		extensions: ['.ts', '.js'],
		fallback: {
			path: require.resolve('path-browserify'),
			fs: require.resolve('fs'),
			util: require.resolve("util")
		},
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				options: {
					configFile: path.join(path.resolve(__dirname), "tsconfig.json")
				},
			},
		]
	}

};