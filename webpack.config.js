const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: './main.ts',
	output: {
		filename: 'webpack_out.js',
		path: path.resolve(__dirname, ''),
	},
	mode: 'production',
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.less$/,
				use: [
					'style-loader',
					'css-loader',
					'less-loader'
				],
			},
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				options: {
					configFile: "tsconfig.json",
					transpileOnly: true,
				},
			},
		]
	},
	plugins: [
		new MiniCssExtractPlugin()
	]
};