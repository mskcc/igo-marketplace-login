build:
	make build-fe && make move-fe && make build-be

config-qa:
	cd igo-marketplace-login && npm run config-qa && cd -

build-fe:
	cd igo-marketplace-login && npm install && npm run build && cd -

build-be:
	cd igo-marketplace-login-backend && npm install && cd -

clean:
	cd igo-marketplace-login-backend && rm -rf node_modules

test:
	cd igo-marketplace-login-backend && npm run test && cd -

move-fe:
	rm -rf igo-marketplace-login-backend/public && cp -rf igo-marketplace-login/build/ igo-marketplace-login-backend/public/

deploy-qa:
	make config-qa && \
	make build && \
	make test && \
    make clean && \
	scp -r igo-marketplace-login-backend dlviigoweb1:deployments/igo-marketplace-login

