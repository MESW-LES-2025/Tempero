export default {
  default: {
    import: ['tests/support/world.js', 'tests/step-definitions/*.js'],
    format: ['progress'],
    paths: ['tests/features/*.feature']
  },
  ci: {
    import: ['tests/support/world.js', 'tests/step-definitions/*.js'],
    format: ['progress', 'json:reports/cucumber-report.json'],
    paths: ['tests/features/*.feature']
  }
};

