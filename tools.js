const process = require('process');

module.exports = {
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