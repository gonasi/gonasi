/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:storybook/recommended",
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "jsx-quotes": ["error", "prefer-single"],
    "react/prop-types": "off",
  },
};

module.exports = config;
