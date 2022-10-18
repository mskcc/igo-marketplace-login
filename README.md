# IGO Marketplace Login
Centralized CAS for IGO applications

## Development
After installing MongoDB https://www.mongodb.com/docs/manual/administration/install-community/ and setting up the `backend` and `frontend`, the login application should be available at `localhost:3000`

### Frontend
```
cd igo-marketplace-login && npm install && npm run start
```
### Backend
```
cd igo-marketplace-login-backend && npm install && npm run dev
```

If the login application is working correctly, you should be able to input your username & password. 

The backend logs should look something like this, 
```
{"message":"Authenticating user: streidd","level":"info","label":"Igo-Marketplace-Login"}
{"message":"Binding streidd to client","level":"info","label":"Igo-Marketplace-Login"}
{"message":"Successful Bind: streidd","level":"info","label":"Igo-Marketplace-Login"}
referral: ldaps://DomainDnsZones.MSKCC.ROOT.MSKCC.ORG/DC=DomainDnsZones,DC=MSKCC,DC=ROOT,DC=MSKCC,DC=ORG
status: 0
status: 0
{"level":"info","message":"Updating user: streidd","label":"Igo-Marketplace-Login"}
{"message":"Regular update: streidd","level":"info","label":"Igo-Marketplace-Login"}
{"level":"info","message":"JWT Token Set: 1313 bytes. Sending successful login response for User: streidd","label":"Igo-Marketplace-Login"}
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

Notes:
* This *DELETES* the existing application on the `HOST` specified. It then copies the packaged application `scp`'d to `~/deployments` on the `HOST` to the new location. 
* Make sure your `~/deployments` exists on that `HOST`!
* The build script packages a built frontend application to the `public` dir of `igo-marketplace-login-backend`  
* `make deploy` is a `Makefile` command. If there are issues w/ this step, please review the `deploy` step of the [Makefile](https://github.com/mskcc/igo-marketplace-login/blob/master/Makefile)
* Expect to enter your password multiple times to `scp` the packaged application and remotely run the install script 
