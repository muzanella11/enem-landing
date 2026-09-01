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
        // Vuetify's v-data-table dotted slot names (#item.company) are a
        // documented convention, not a real v-slot modifier.
        'vue/valid-v-slot': ['error', { allowModifiers: true }],
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
