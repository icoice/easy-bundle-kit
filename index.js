#!/usr/bin/env node
const debug = require('debug')('easy-bundel-kit');
const cli = require('cli');
const npmCli = require('./npm-cli');
const { getCommandMap } = require('./tools');
const {
    WEBPACK_DEPENDENCE,
    WEBPACK_CODE_PLUGINS_IMPORTS,
    WEBPACK_CODE_PLUGINS_DESTRUCT_IMPORTS,
    WEBPACK_CODE_PLUGINS_SETTING,
    WEBPACK_COMMON_PLUGINS,
    WEBPACK_ES,
    WEBPACK_TS,
    wsBuildConfig,
} = request('./build-webpack');

const error = debug.extend('error');
const { path, fs } = cli.native;
const absPath = link => path.resolve(__dirname, link);
const entryName = 'main';
const tips = {
    order_webpack_explain: '生成Webpack默认配置',
    order_language_explain:  '设置开发语言',
    order_output_explain: '设置配置/打包文件导出路径',
    order_entry_expalin: `设置入口文件名称, 默认名称为${entryName}`,
    order_bundle_explain: '设置打包文件名称',
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
    systemjs: [shortNames.systemjs, tips.order_systemjs_explain],
};

WEBPACK_COMMON_PLUGINS.map(module => {
    const splitGroup = module.name.split('-');
    const variableName = splitGroup.map(n => `${n[0].toUpperCase()}${n.slice(1, n.length)}`).join('');

    return { variableName, moduleName: module.name, destruct: module.destruct };
}).map(({ variableName, moduleName, destruct }) => {
    if (destruct) {
        WEBPACK_CODE_PLUGINS_DESTRUCT_IMPORTS.push(`const { ${variableName} } = require('${moduleName}');`);
    } else {
        WEBPACK_CODE_PLUGINS_IMPORTS.push(`const ${variableName} = require('${moduleName}');`);
    }

    WEBPACK_CODE_PLUGINS_SETTING.push(`new ${variableName}()`);
});

// easy-bundle-kit -w -> print to cli.command
// easy-bundle-kit --webpack -> print to cli.command
// single page use: easy-bunlde-kit --webpack --output ./ --language typescript postcss pug scss
// multiple page use: easy-bundle-kit --webpack --multiple-page
cli.parse(commander);
cli.main(async function () {
    debug('Bundle kit standby');

    const { options } = this;
    const commandMap = getCommandMap();
    const entryPath = !options.entry ? absPath('./') : absPath(commandMap.entry[0]); // 确认配置文件入口路径
    const outputPath = !options.output ? entryPath : absPath(commandMap.output[0]); // 确认配置文件输出路径
    const directory = fs.readdirSync(entryPath);

    debug(`检查入口文件: ${entryPath}`);
    debug(`确认导出路径: ${outputPath}`);

    if (!directory || directory.length <= 0) return error(tips.error_entry_not_found);

    const findEntryFile = directory.filter(filename => filename.indexOf(entryName) >= 0);

    debug(`发现入口文件：${findEntryFile.length > 0 ? findEntryFile.join('、') : 'Not Found'}`);

    if (findEntryFile.length <= 0) return error(tips.error_entry_not_found);

    // WEBPACK - 单入口打包
    if (options.webpack) {
        const config = wsBuildConfig(options, { entryPath, outputPath }, commandMap);

        if (!config) return error(tips.error_choose_your_bundle_kit);
    
        fs.createWriteStream(path.resolve(`${outputPath}/webpack.config.js`)).write(config);

        // 初始化开发环境
        await npmCli.init({ cwd: entryPath });

        await npmCli.install(Array.from(new Set([
            ...WEBPACK_DEPENDENCE,
            ...WEBPACK_COMMON_PLUGINS.map(module => module.name)])),
            { cwd: entryPath }, 'dev');

        await npmCli.install(Array.from(new Set([]
            .concat(commandMap.language.includes('ecmascript') ? WEBPACK_ES.dependence : [])
            .concat(commandMap.language.includes('typescript') ? WEBPACK_TS.dependence : []))),
            { cwd: entryPath }, 'dev');
    }
});