# easy-bundle-kit

用于快速生成对应的前端开发环境。

##### Install

    npm install --save-dev easy-bunlde-kit

##### Command

    Options:
    -w, --webpack          生成Webpack默认配置
    -l, --language         设置开发语言
    -o, --output           设置配置/打包文件导出路径
    -e, --entry            设置入口文件名称, 默认名称为main
    -b, --bundle           设置打包文件名称
    -s, --systemjs         设置开启支持systemjs
    -h, --help             Display help and usage details

##### Examples

    npx easy-bunlde-kit --webpack --entry ./examples --language typescript ecmascript
##### Support bundle kit

- webpack


##### Support language

- Typescirpt
- Ecmascript（2015 - 2020）
- Pug