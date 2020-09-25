const properties = {
    'base': {
        login: 'http://localhost:4200/api/auth',
        home: 'http://localhost:3000'
    },
    'qa': {
        login: '/login/api/auth',
        home: 'https://igodev.mskcc.org'
    },
    'prod': {
        login: '/login/api/auth',
        home: 'https://igo.mskcc.org'
    }
}

const env = process.env.REACT_APP_ENV.toLowerCase();
const config = Object.assign( properties.base, properties[ env ] )
if(env !== 'prod'){
    console.log(`${env.toUpperCase()} ENVIRONMENT: ${JSON.stringify(config)}`);
}

export const LOGIN_ENDPOINT = config.login;
export const IGO_HOME = config.home;
