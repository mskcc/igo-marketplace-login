# IGO Marketplace Login
Centralized CAS for IGO applications

## Development
### Frontend
```
cd igo-marketplace-login && npm run start
```
### Backend
```
cd igo-marketplace-login-backens && npm run dev
```

### Backend

## Deployment
Deploy scripts will create a directory that can be deployed and served w/ `npm run start`
### QA
``` 
make ENV=qa HOST=dlviigoweb1 deploy
```

### PROD
``` 
make ENV=prod HOST=plviigoweb1 deploy
```