const { spawn } = require('child_process');
const debug = require('debug')('easy-bundel-kit:npm');
const warnning = debug.extend('warnning');

export const init = async (options = {}) => { 
    debug(`Init npm environment`);

    return new Promise(resolve => {
        const npmCliName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const npm = spawn(npmCliName, ['init', '--yes'], options);
    
        npm.stdout.on('data', () => {
            debug(`Init now`);
        });
    
        npm.stdout.on('close', () => {
            debug('Init complete');
            resolve();
        });
    });
};


export const install = async (dependence = [], options = {}, dev = '') => {
    return new Promise(resolve => {
        debug('npm install dependencies');
        
        const npmCliName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const npm = spawn(npmCliName ? 'npm.cmd' : 'npm',
            ['install', `--save${dev !== '' ? '-' + dev : ''}`].concat(dependence),
            options);
        let warnCount = 0;
        let warnContents = [];

        npm.stderr.on('data', data => {
            warnCount += 1;

            warnning(`Warn count ${warnCount}`);
            warnContents.push(data);
        });

        npm.stdout.on('data', () => {
            dependence.map(module => debug(`install ${module}`));
        });

        npm.stdout.on('close', () => {
            debug('Install complete');
            resolve();
        });
    });
}

export default {
    init,
    install,
};