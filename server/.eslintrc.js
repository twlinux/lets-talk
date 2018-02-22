module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "browser": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "linebreak-style": [
            "error",
            "unix"
        ],
        "semi": [
            "warn",
            "always"
        ],
        "no-console": "off",
        "no-fallthrough": "off",
        "no-unused-vars": "warn",
    }
};