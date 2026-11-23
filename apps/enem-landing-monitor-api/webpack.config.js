const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { DefinePlugin } = require('webpack');
const { readFileSync } = require('fs');
const { join } = require('path');

const { version } = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8'),
);

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
    // Workspace version shown on the monitor's overview page.
    new DefinePlugin({ __MONITOR_API_VERSION__: JSON.stringify(version) }),
  ],
};
