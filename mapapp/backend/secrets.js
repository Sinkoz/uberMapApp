// secrets.js
const secrets = {
  dbUri: 'mongodb://localhost/centralized'
};

export const getSecret = key => secrets[key];
