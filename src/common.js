const path = require('path');
const process = require('process');

const DEF_BUNDLE_FILE_NAME = 'bundle.js';
const DEF_ENTRY_FILE_NAME = 'main';
const TIPS = {
    order_webpack_explain: '[webpack] - 创建默认配置',
    order_language_explain:  '设置开发语言',
    order_output_explain: '设置配置/打包文件导出路径',
    order_entry_expalin: `设置入口文件名称, 默认名称为${DEF_ENTRY_FILE_NAME}`,
    order_bundle_explain: `设置打包文件名称，默认为${DEF_BUNDLE_FILE_NAME}`,
    order_systemjs_explain: '[systemjs] - 设置开启支持',
    error_entry_not_found: '指定目录内未发现入口文件',
    error_choose_your_bundle_kit: '未指定打包器',
};

const SHORT_NAMES = {
    webpack: 'w',
    language: 'l',
    output: 'o',
    entry: 'e',
    bundle: 'b',
    bundlePath: 'p',
    systemjs: 's',
};

const COMMANDS = {
    webpack: [SHORT_NAMES.webpack, TIPS.order_webpack_explain],
    language: [SHORT_NAMES.language, TIPS.order_language_explain],
    output: [SHORT_NAMES.output, TIPS.order_output_explain],
    entry: [SHORT_NAMES.entry, TIPS.order_entry_expalin],
    bundle: [SHORT_NAMES.bundle, TIPS.order_bundle_explain],
    systemjs: [SHORT_NAMES.systemjs, TIPS.order_systemjs_explain],
}

const shortNameTurn = {};

Object.entries(SHORT_NAMES).forEach(([full, short]) => {
    shortNameTurn[short] = full;
});

const rs = link => path.resolve(process.cwd(), link);

module.exports = {
    rs,
    TIPS,
    COMMANDS,
    DEF_BUNDLE_FILE_NAME,
    DEF_ENTRY_FILE_NAME,
    getCommandMap() {
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
    },
};