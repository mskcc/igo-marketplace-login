build:
	make ENV=$(ENV) build-fe && make move-fe && make build-be

build-fe:
	cd igo-marketplace-login && rm -rf node_modules; rm package-lock.json; npm install && REACT_APP_ENV=$(ENV) npm run build && cd -

build-be:
	cd igo-marketplace-login-backend && rm -rf node_modules; rm package-lock.json; npm install && npm run test && rm -rf node_modules && cd -

move-fe:
	rm -rf igo-marketplace-login-backend/public && cp -rf igo-marketplace-login/build/ igo-marketplace-login-backend/public/

install:
	ssh $(HOST) 'dzdo -S rm -rf /srv/www/igo-marketplace-login && mv ~/deployments/igo-marketplace-login/ /srv/www && cd /srv/www/igo-marketplace-login && npm install && dzdo pm2 restart login'

test_host:
	if [[ "$(HOST)" != "" ]]; then echo "Deploying to $(HOST)"; else printf "\nPlease specify HOST, e.g.\n\t'make HOST=igo.mskcc.org deploy'\n\n" && exit 1; fi

deploy:
	make HOST=$(HOST) test_host && \
	make ENV=$(ENV) build && \
	scp -r igo-marketplace-login-backend $(HOST):deployments/igo-marketplace-login && \
	make HOST=$(HOST) install
