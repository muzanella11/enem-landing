import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import baseConfig from '../../eslint.config.mjs';

export default createConfigForNuxt({
  features: {
    typescript: true,
  },
})
  .prepend(...baseConfig)
  .append(
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
        // `@nuxt/eslint-config`'s default (void: 'never') disagrees with
        // Prettier, which always self-closes void elements (<img />, <br />,
        // <hr />, <input />) in .vue templates - `eslint-config-prettier` is
        // a dependency but isn't wired into any flat config in this repo, so
        // nothing actually reconciles the two. Aligning this one rule to
        // Prettier's real output is more targeted than pulling in the
        // repo-wide preset here.
        'vue/html-self-closing': [
          'warn',
          {
            html: { void: 'always', normal: 'always', component: 'always' },
            svg: 'always',
            math: 'always',
          },
        ],
      },
    },
    {
      ignores: [
        '.nuxt/**',
        '.output/**',
        'node_modules',
        '**/*.d.ts',
        '**/*.vue.js',
      ],
    },
  );
