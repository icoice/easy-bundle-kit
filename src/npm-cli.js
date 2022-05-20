const { spawn } = require('child_process');
const debug = require('debug')('easy-bundel-kit:npm');
const warnning = debug.extend('warnning');

const init = async (options = {}) => { 
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

const install = async (dependence = [], options = {}, dev = '') => {
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

            warnning(`Install warn count ${warnCount}`);
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

const script = async (scripts = {}, options = {}) => {
    return new Promise(resolve => {
        debug('npm set script');

        console.log(['set-script'].concat(Object.entries(scripts).map(([scriptName, command]) => `${scriptName} "${command}"`)));

        const npmCliName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const npm = spawn(npmCliName ? 'npm.cmd' : 'npm',
            ['set-script'].concat(Object.entries(scripts).map(([scriptName, command]) => `${scriptName} "${command}"`)),
            options);

        npm.stderr.on('data', data => {
            warnning(`${data}`);
        });

        npm.stdout.on('data', () => {
            Object.entries(scripts).map(([scriptName]) => debug(`set ${scriptName}`));
        });

        npm.stdout.on('close', () => {
            debug('Set complete');
            resolve();
        });
    });
};

module.exports = {
    init,
    install,
    script,
};