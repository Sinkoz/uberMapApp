// secrets.js
const appPort = '3030';
const serverPort = '3001';
const devUri = 'http://localhost';
const prodUri = 'http://172.20.20.189';

const secrets = {
  dbUri: 'mongodb://localhost/centralized',
  devAppUri: devUri + ':' + appPort,
  prodAppUri: prodUri + ':' + appPort,
  devServerUri: devUri + ':' + serverPort,
  prodServerUri: prodUri + ':' + serverPort
};

export const getSecret = key => secrets[key];
