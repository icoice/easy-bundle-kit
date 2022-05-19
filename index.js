#!/usr/bin/env node
const debug = require('debug')('easy-bundel-kit');
const cli = require('cli');
const util = require('util');
const process = require('process');
const error = debug.extend('error');
const { path, fs } = cli.native;
const absPath = link => path.resolve(__dirname, link);
const WEBPACK_DEFAULT_CONFIG = {};
const WEBPACK_COMMON_PLUGINS = ['clean-webpack-plugin'];
const WEBPACK_DEPENDENCE = ['webpack', 'webpack-cli'];
const WEBPACK_CODE_PLUGINS_IMPORTS = [];
const WEBPACK_CODE_PLUGINS_SETTING = [];
const DEF_EXCLUDE_PATH = /dist|node_modules/;

const WEBPACK_BABEL_CONF = (dependence = [], presets = [], plugins = []) => ({
    dependence: ['babel-loader', ...dependence],
    config: {
        test: /\.m?js$/,
        exclude: DEF_EXCLUDE_PATH,
        use: {
            loader: 'babel-loader',
            options: {
                presets: [...presets],
                plugins: [...plugins],
            },
        },
    },
});

// ecmascript
const WEBPACK_ES = WEBPACK_BABEL_CONF(
    // dependence
    [
        '@babel/preset-env',
        '@babel/plugin-transform-runtime',
    ],
    // presets
    [
        ['@babel/preset-env', { targets: "defaults" }], // 默认es2015至es2020所有语法都编译成过渡用法
    ],
    // plugins
    [
        '@babel/plugin-transform-runtime'
    ],
);

 // typescript
const WEBPACK_TS = WEBPACK_BABEL_CONF(
    // dependence
    ['@babel/preset-typescript'],
    // presets
    ['@babel/preset-typescript'],
);

WEBPACK_COMMON_PLUGINS.map(moduleName => {
    const splitGroup = moduleName.split('-');
    const variableName = splitGroup.map(n => `${n[0].toUpperCase()}${n.slice(1, n.length)}`).join('');

    return { variableName, moduleName };
}).map(({ variableName, moduleName }) => {
    WEBPACK_CODE_PLUGINS_IMPORTS.push(`const ${variableName} = require('${moduleName}');`);
    WEBPACK_CODE_PLUGINS_SETTING.push(`new ${variableName}()`);
});

WEBPACK_DEFAULT_CONFIG.mode = 'development';
WEBPACK_DEFAULT_CONFIG.entry = '';
WEBPACK_DEFAULT_CONFIG.output = {};
WEBPACK_DEFAULT_CONFIG.plugins = '${plugins}';

const entryName = 'main';
const bundleFileName = 'bundle.js';
const tips = {
    order_webpack_explain: '生成Webpack默认配置',
    order_language_explain:  '设置开发语言',
    order_output_explain: '设置配置文件输出地址',
    order_entry_expalin: `设置入口文件名称, 默认名称为${entryName}`,
    order_bundle_explain: '设置打包文件名称',
    order_bundle_path_explain: '设置打包文件的输出路径',
    order_systemjs_explain: '设置开启支持systemjs',
    error_entry_not_found: '目录下未发现入口文件，请创建main.(js|ts|jsx)文件',
    error_choose_your_bundle_kit: '未指定打包器',
};

const shortNames = {
    webpack: 'w',
    language: 'l',
    output: 'o',
    entry: 'e',
    bundle: 'b',
    bundlePath: 'p',
    systemjs: 's',
};

const shortNameTurn = {};

Object.entries(shortNames).forEach(([full, short]) => {
    shortNameTurn[short] = full;
});

const commander = {
    webpack: [shortNames.webpack, tips.order_webpack_explain],
    language: [shortNames.language, tips.order_language_explain],
    output: [shortNames.output, tips.order_output_explain],
    entry: [shortNames.entry, tips.order_entry_expalin],
    bundle: [shortNames.bundle, tips.order_bundle_explain],
    bundlePath: [shortNames.bundlePath, tips.order_bundle_path_explain],
    systemjs: [shortNames.systemjs, tips.order_systemjs_explain],
};

const getCommandMap = () => {
    const processCommand = process.argv.slice(2, process.argv.length);
    const commandMap = {};
    let command = '';

    processCommand.map(params => {
        // 校验是否为指令
        if (/^-|--/.test(params)) {
            const processName = params.replace(/^--/, '').replace(/^-/, '');
            const commandName = shortNameTurn[processName] || processName;

            if (command !== commandName) command = commandName;
            if (!commandMap[commandName]) commandMap[commandName] = [];
        // 获取指令后的参数
        } else {
            commandMap[command].push(params);
        }
    });

    return commandMap;
}

let findEntryFile = [];

const buildWebpack = (options, commandMap) => {
    let config = 'None content, check your command.';

    debug('选择打包配置：Webpack');
    debug(`选择入口文件：${findEntryFile[0]}`);

    WEBPACK_DEFAULT_CONFIG.entry = path.resolve(__dirname, findEntryFile[0]);
    WEBPACK_DEFAULT_CONFIG.output = {
        filename: !options.bundle ? bundleFileName : options.bundle,
        path: !options.bundlePath ? path.resolve(__dirname, './dist') : options.bundlePath,

        ...(options.systemjs ? { libraryTarget: 'system' } : {}),
    };

    if (options.language) {
        WEBPACK_DEFAULT_CONFIG.module = {};
        WEBPACK_DEFAULT_CONFIG.module.rules = [];
    }

    if (commandMap.language.indexOf('ecmascript') >= 0)  {
        WEBPACK_DEFAULT_CONFIG.module.rules.push(WEBPACK_ES.config);
    }

    if (commandMap.language.indexOf('typescript') >= 0)  {
        WEBPACK_DEFAULT_CONFIG.module.rules.push(WEBPACK_TS.config);
    }

    config = util.inspect(WEBPACK_DEFAULT_CONFIG, { compact: false, depth: Infinity, breakLength: 80 });

    return  `${WEBPACK_CODE_PLUGINS_IMPORTS.join('')}

module.exports = ${config.replace('\'${plugins}\'', `[${WEBPACK_CODE_PLUGINS_SETTING.join(',')}]`)};
`;
};

// easy-bundle-kit -w -> print to cli.command
// easy-bundle-kit --webpack -> print to cli.command
// single page use: easy-bunlde-kit --webpack --output ./ --language typescript postcss pug scss
// multiple page use: easy-bundle-kit --webpack --multiple-page
cli.parse(commander);
cli.main(function () {
    const { options } = this;
    const commandMap = getCommandMap();
    const entryPath = !options.entry ? absPath('./') : absPath(commandMap.entry[0]); // 确认配置文件入口路径
    const outputPath = !options.output ? entryPath : absPath(commandMap.output[0]); // 确认配置文件输出路径
    const directory = fs.readdirSync(entryPath);

    debug(`检查入口文件: ${entryPath}`);
    debug(`确认导出路径: ${outputPath}`);

    if (!directory || directory.length <= 0) return error(tips.error_entry_not_found);

    findEntryFile = directory.filter(filename => filename.indexOf(entryName) >= 0);

    debug(`发现入口文件：${findEntryFile.length > 0 ? findEntryFile.join('、') : 'Not Found'}`);

    if (findEntryFile.length <= 0) return error(tips.error_entry_not_found);

    let config = null;

    // WEBPACK - 单入口打包
    if (options.webpack) config = buildWebpack(options, commandMap);

    if (!config) return error(tips.error_choose_your_bundle_kit);
    if (options.webpack) fs.createWriteStream(path.resolve(`${outputPath}/webpack.config.js`)).write(config);

    /* 针对入口位置安装依赖 */
    cli.exec('npm init --yes', () => {
        console.log('success');
    }, e => {
        console.log(e);
    });
});