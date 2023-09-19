from fastapi import Body, FastAPI, Form, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from worker import create_task

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("home.html", context={
        "request": request
    })


@app.post("/tasks")
def run_task(payload=Body(...)):
    create_task.apply_async([payload['query'], payload['email']])
    return JSONResponse({
        "status": 200,
    })


print('ok')