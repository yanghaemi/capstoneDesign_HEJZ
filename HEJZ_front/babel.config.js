//module.exports = {
//  presets: ['module:@react-native/babel-preset'],
//};

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ["dotenv-import", {
      "moduleName": "@env",
      "path": ".env",
      "blacklist": null,
      "whitelist": null,
      "safe": false,
      "allowUndefined": true
    }]
  ]
};
