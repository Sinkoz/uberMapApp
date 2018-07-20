// secrets.js
const appPort = '3030';
const serverPort = '3001';
const devUri = 'http://localhost';
const prodUri = 'http://172.20.20.189';

const secrets = {
  devDbUri: 'mongodb://localhost/centralized',
  prodDbUri: 'mongodb://172.20.20.189/centralized',
  devAppUri: devUri + ':' + appPort,
  prodAppUri: prodUri + ':' + appPort,
  devServerUri: devUri + ':' + serverPort,
  prodServerUri: prodUri + ':' + serverPort
};

export const getSecret = key => secrets[key];
