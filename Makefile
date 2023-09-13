up:
	docker-compose up -d
exec:
	docker-compose exec web bash
build:
	docker-compose build --no-cache --force-rm
	@make up
stop:
	docker-compose stop
down:
	docker-compose down
restart:
	@make down
	@make up
destroy:
	docker-compose down --rmi all --volumes
destroy-volumes:
	docker-compose down --volumes
ps:
	docker-compose ps
logs:
	docker-compose logs
