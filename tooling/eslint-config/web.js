/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: [
    "universe/web",
    "./base.js",
    "./web-native.js",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  rules: {
    "react/prop-types": "off",
  },
  ignorePatterns: ["!**/.server", "!**/.client"],
  settings: {
    formComponents: ["Form"],
    linkComponents: [
      { name: "Link", linkAttribute: "to" },
      { name: "NavLink", linkAttribute: "to" },
    ],
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};

module.exports = config;
