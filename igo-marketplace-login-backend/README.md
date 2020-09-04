# IGO Marketplace Login Backend

## Description
API to validate user login 

## Dev
```
npm install
npm run dev
```
API should now be serving from `http://localhost:4200`

**Login**

POST: http://localhost:4200/api/auth/login
```
{
	"userName": "",
	"password": ""
}
```

GET:  http://localhost:4200/api/session/user
