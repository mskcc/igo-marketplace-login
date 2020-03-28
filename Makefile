build:
	make build-fe && make move-fe

config-qa:
	cd igo-marketplace-login && npm run config-qa && cd -

build-fe:
	cd igo-marketplace-login && npm install && npm run build && cd -

clean:
	cd igo-marketplace-login-backend && rm -rf node_modules

move-fe:
	rm -rf igo-marketplace-login-backend/public && cp -rf igo-marketplace-login/build/ igo-marketplace-login-backend/public/

deploy-qa:
	make clean && \
	make config-qa && \
	make build && \
	scp -r igo-marketplace-login-backend dlviigoweb1:deployments/igo-marketplace-login

