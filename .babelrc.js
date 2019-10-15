/** @format */

const plugins = [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-transform-modules-commonjs'
];

const presets = [
    [
        '@babel/preset-env',
        {
            targets: {
                node: 'current'
            },
            useBuiltIns: 'usage',
            corejs: 3
        }
    ]
];

module.exports = { plugins, presets };
