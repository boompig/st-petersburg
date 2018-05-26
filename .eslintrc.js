module.exports = {
    "env": {
        "es6": true,
        "browser": true,
    },
    "parserOptions": {
        "sourceType": "module",
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};