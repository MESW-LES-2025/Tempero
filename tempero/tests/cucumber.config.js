module.exports = {
  default: {
    require: ['tests/step-definitions/**/*.js', 'tests/support/**/*.js'],
    format: ['progress', 'json:reports/cucumber-report.json'],
    paths: ['tests/features/**/*.feature'],
    parallel: 2
  }
};

