const path = require('path');
const debug = require('debug')('easy-bundel-kit:webpack');
const util = require('util');
const { DEF_BUNDLE_FILE_NAME } = require('./common');

const DEF_EXCLUDE_PATH = /dist|node_modules/;
const WEBPACK_DEFAULT_CONFIG = {};
const WEBPACK_DEPENDENCE = ['webpack', 'webpack-cli'];
const WEBPACK_CODE_PLUGINS_IMPORTS = [];
const WEBPACK_CODE_PLUGINS_DESTRUCT_IMPORTS = [];
const WEBPACK_CODE_PLUGINS_SETTING = [];
const WEBPACK_COMMON_PLUGINS = [
    {
        name: 'clean-webpack-plugin',
        destruct: true,
    },
];

const WEBPACK_PUG_CONF = () => ({
    dependence: ['pug-loader'],
    config: {
        test: /\.m?pug$/,
        exclude: DEF_EXCLUDE_PATH,
        use: [
            { loader: 'pug-loader' }
        ]
    },
});

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

// typescript
const WEBPACK_PUG = WEBPACK_PUG_CONF();

WEBPACK_DEFAULT_CONFIG.mode = 'development';
WEBPACK_DEFAULT_CONFIG.entry = '';
WEBPACK_DEFAULT_CONFIG.output = {};
WEBPACK_DEFAULT_CONFIG.plugins = '${plugins}';
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

module.exports = {
    WEBPACK_DEPENDENCE,
    WEBPACK_CODE_PLUGINS_IMPORTS,
    WEBPACK_CODE_PLUGINS_DESTRUCT_IMPORTS,
    WEBPACK_CODE_PLUGINS_SETTING,
    WEBPACK_COMMON_PLUGINS,
    WEBPACK_PUG,
    WEBPACK_ES,
    WEBPACK_TS,
    wsBuildConfig(options, { entryPath, outputPath }, commandMap) {
        let config = 'None content, check your command.';
    
        debug('选择打包配置：Webpack');
        debug(`选择入口文件：${entryPath}`);
    
        WEBPACK_DEFAULT_CONFIG.entry = entryPath;
        WEBPACK_DEFAULT_CONFIG.output = {
            filename: !options.bundle ? DEF_BUNDLE_FILE_NAME : options.bundle,
            path: entryPath === outputPath ? path.resolve(outputPath, './dist') : outputPath,
            ...(options.systemjs ? { libraryTarget: 'system' } : {}),
        };
    
        if (options.language) {
            WEBPACK_DEFAULT_CONFIG.module = {};
            WEBPACK_DEFAULT_CONFIG.module.rules = [];
        }

        if (commandMap.language.includes('pug')) {
            WEBPACK_DEFAULT_CONFIG.module.rules.push(WEBPACK_PUG.config);
        }
    
        if (commandMap.language.includes('ecmascript'))  {
            WEBPACK_DEFAULT_CONFIG.module.rules.push(WEBPACK_ES.config);
        }
    
        if (commandMap.language.includes('typescript'))  {
            WEBPACK_DEFAULT_CONFIG.module.rules.push(WEBPACK_TS.config);
        }
    
        config = util.inspect(WEBPACK_DEFAULT_CONFIG, {
            compact: false,
            depth: Infinity,
            breakLength: 80,
        });
    
        return  `${WEBPACK_CODE_PLUGINS_DESTRUCT_IMPORTS.join('')}
${WEBPACK_CODE_PLUGINS_IMPORTS.join('')}

module.exports = ${config.replace('\'${plugins}\'', `[${WEBPACK_CODE_PLUGINS_SETTING.join(',')}]`)};
    `;
    },
}