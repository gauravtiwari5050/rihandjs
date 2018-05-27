module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "func-names": "off",
        "global-require": "off",
        "class-methods-use-this": "off",
        "no-underscore-dangle": "off",
        "no-restricted-syntax": "off",
        "no-await-in-loop": "off",
        "import/no-extraneous-dependencies": ["error", {"devDependencies": false, "optionalDependencies": false, "peerDependencies": false}]
    },
    "env": {
        "node": true,
        "mocha": true
    }
};
