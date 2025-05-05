/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["universe/native", "@react-native", "./base.js", "./web-native.js"],
  overrides: [
    {
      // Now we enable eslint-plugin-testing-library rules or preset only for matching testing files
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
      extends: ["plugin:testing-library/react"],
    },
  ],
};

module.exports = config;
