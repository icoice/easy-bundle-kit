const process = require('process');
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

module.exports = {
    tips,
    entryName,
    shortNames,
    shortNameTurn,
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