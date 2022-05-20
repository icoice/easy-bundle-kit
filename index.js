#!/usr/bin/env node
const debug = require('debug')('easy-bundel-kit');
const path = require('path');
const cli = require('cli');
const fs = require('fs');
const npmCli = require('./src/npm-cli');
const {
    getCommandMap,
    DEF_ENTRY_FILE_NAME,
    COMMANDS,
    TIPS,
    rs,
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

// easy-bundle-kit -w -> print to cli.command
// easy-bundle-kit --webpack -> print to cli.command
// single page use: easy-bunlde-kit --webpack --output ./ --language typescript postcss pug scss
// multiple page use: easy-bundle-kit --webpack --multiple-page
cli.parse(COMMANDS);
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
        return error(TIPS.error_entry_not_found);
    }

    const findEntryFile = directory.filter(filename => filename.includes(DEF_ENTRY_FILE_NAME));

    debug(`发现入口文件：${findEntryFile.length > 0 ? findEntryFile.join('、') : 'Not Found'}`);

    if (findEntryFile.length <= 0) {
        return error(TIPS.error_entry_not_found);
    }

    /* webpack */
    if (options.webpack) {
        //  - single entry bundle
        const config = wsBuildConfig(options, { entryPath, outputPath }, commandMap);

        if (!config) {
            return error(TIPS.error_choose_your_bundle_kit);
        }
    
        fs.createWriteStream(path.resolve(`${outputPath}/webpack.config.js`))
            .write(config);

        // init develop env
        await npmCli.init({ cwd: entryPath });

        // script
        await npmCli.script({
            start: 'npm run rush',
        });

        await npmCli.script({
            serve: 'npx serve --debug --no-etag -C -p 7500',
        });

        // basic
        await npmCli.install(Array.from(new Set([
            ...WEBPACK_DEPENDENCE,
            ...WEBPACK_COMMON_PLUGINS.map(module => module.name)])),
            { cwd: entryPath }, 'dev');
        
        // language
        await npmCli.install(Array.from(new Set([]
            .concat(commandMap.language.includes('pug') ? WEBPACK_PUG.dependence : [])
            .concat(commandMap.language.includes('ecmascript') ? WEBPACK_ES.dependence : [])
            .concat(commandMap.language.includes('typescript') ? WEBPACK_TS.dependence : []))),
            { cwd: entryPath }, 'dev');
    }
});