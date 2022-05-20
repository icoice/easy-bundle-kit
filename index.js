#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const debug = require('debug')('easy-bundel-kit');
const cli = require('cli');
const npmCli = require('./src/npm-cli');
const {
    getCommandMap,
    entryName,
    shortNames,
    tips,
} = require('./src/common');
const {
    WEBPACK_DEPENDENCE,
    WEBPACK_COMMON_PLUGINS,
    WEBPACK_PUG,
    WEBPACK_ES,
    WEBPACK_TS,
    wsBuildConfig,
} = require('./src/build-webpack');
const error = debug.extend('error');
const rs = link => path.resolve(__dirname, link);

// easy-bundle-kit -w -> print to cli.command
// easy-bundle-kit --webpack -> print to cli.command
// single page use: easy-bunlde-kit --webpack --output ./ --language typescript postcss pug scss
// multiple page use: easy-bundle-kit --webpack --multiple-page
cli.parse({
    webpack: [shortNames.webpack, tips.order_webpack_explain],
    language: [shortNames.language, tips.order_language_explain],
    output: [shortNames.output, tips.order_output_explain],
    entry: [shortNames.entry, tips.order_entry_expalin],
    bundle: [shortNames.bundle, tips.order_bundle_explain],
    systemjs: [shortNames.systemjs, tips.order_systemjs_explain],
});

cli.main(async function () {
    debug('Bundle kit standby');

    const { options } = this;
    const commandMap = getCommandMap();
    const entryPath = !options.entry ? rs('./') : rs(commandMap.entry[0]); // 确认配置文件入口路径
    const outputPath = !options.output ? entryPath : rs(commandMap.output[0]); // 确认配置文件输出路径
    const directory = fs.readdirSync(entryPath);

    debug(`检查入口文件: ${entryPath}`);
    debug(`确认导出路径: ${outputPath}`);

    if (!directory || directory.length <= 0) {
        return error(tips.error_entry_not_found);
    }

    const findEntryFile = directory.filter(filename => filename.indexOf(entryName) >= 0);

    debug(`发现入口文件：${findEntryFile.length > 0 ? findEntryFile.join('、') : 'Not Found'}`);

    if (findEntryFile.length <= 0) {
        return error(tips.error_entry_not_found);
    }

    /* webpack */
    if (options.webpack) {
        //  - single entry bundle
        const config = wsBuildConfig(options, { entryPath, outputPath }, commandMap);

        if (!config) {
            return error(tips.error_choose_your_bundle_kit);
        }
    
        fs.createWriteStream(path.resolve(`${outputPath}/webpack.config.js`))
            .write(config);

        // init develop env
        await npmCli.init({ cwd: entryPath });

        await npmCli.install(Array.from(new Set([
            ...WEBPACK_DEPENDENCE,
            ...WEBPACK_COMMON_PLUGINS.map(module => module.name)])),
            { cwd: entryPath }, 'dev');

        await npmCli.install(Array.from(new Set([]
            .concat(commandMap.language.includes('pug') ? WEBPACK_PUG.dependence : [])
            .concat(commandMap.language.includes('ecmascript') ? WEBPACK_ES.dependence : [])
            .concat(commandMap.language.includes('typescript') ? WEBPACK_TS.dependence : []))),
            { cwd: entryPath }, 'dev');
    }
});