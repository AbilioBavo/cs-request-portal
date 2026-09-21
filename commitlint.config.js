/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['api', 'app', 'auth', 'mocks', 'requests', 'shared', 'test', 'e2e', 'ci', 'deps'],
    ],
  },
}
