const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: './index.ts',
	output: {
		filename: 'webpack_out.js',
		path: path.resolve(__dirname, ''),
	},
	mode: 'production',
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
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
					configFile: "tsconfig.json"
				},
				exclude: /node_modules/,
			},
		]
	},
	plugins: [
		new MiniCssExtractPlugin()
	],
	devServer: {
		static: {
		  directory: path.join(__dirname, 'dist/public_html'),
		},
		compress: true,
		port: 9000,
	},
};