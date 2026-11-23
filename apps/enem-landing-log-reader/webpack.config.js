const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

// No runtime npm dependencies (only Node built-ins and type-only imports
// from @enem-landing/shared-types), so dist/main.js runs on its own: the
// image needs no `yarn install` step.
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
  ],
};
