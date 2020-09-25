build:
	make ENV=$(ENV) build-fe && make move-fe && make build-be

build-fe:
	cd igo-marketplace-login && npm install && REACT_APP_ENV=$(ENV) npm run build && cd -

build-be:
	cd igo-marketplace-login-backend && npm install && npm run test && rm -rf node_modules && cd -

test:
	cd igo-marketplace-login-backend && npm run test && cd -

move-fe:
	rm -rf igo-marketplace-login-backend/public && cp -rf igo-marketplace-login/build/ igo-marketplace-login-backend/public/

deploy:
	make ENV=$(ENV) build && \
	scp -r igo-marketplace-login-backend $(HOST):deployments/igo-marketplace-login