module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "browser": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "warn",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "warn",
            "always"
        ],
        "no-console": "off",
        "no-fallthrough": "off",
        "no-unused-vars": "warn"
    }
};