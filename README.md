# BERT Score getter with FastAPI and Celery

Example of how to handle background processes with FastAPI, Celery, and Docker.

## Want to use this project?

Spin up the containers:

```sh
$ docker-compose up -d --build
```

Open your browser to [http://localhost:5002](http://localhost:8004) to view the app.

Trigger a new task:

```sh
$ curl http://localhost:5002/tasks -H "Content-Type: application/json" --data '{"type": 0}'
```

Check the status:

```sh
$ curl http://localhost:5002/tasks/<TASK_ID>
```
