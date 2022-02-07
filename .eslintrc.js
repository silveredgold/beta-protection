module.exports = {
  root: true,

  env: {
    node: true,
    webextensions: true,
  },

  extends: [
    'plugin:vue/vue3-essential',
    // '@vue/airbnb',
  ],

  parserOptions: {
    parser: '@typescript-eslint/parser',
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prefer-const': 'warn'
  },

  'extends': [
    'plugin:vue/vue3-essential',
    '@vue/typescript'
  ]
};
