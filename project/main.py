from celery.result import AsyncResult
from fastapi import Body, FastAPI, Form, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from worker import get_result, get_bert_score, create_task

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")



@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("home.html", context={"request": request})


@app.post("/tasks", status_code=201)
def run_task(payload = Body(...)):
    query = payload['query']
    res = get_result(query)
    # task = create_task.apply_async([query])
    # return JSONResponse({"task_id": task.id})
    return res


@app.get("/tasks/{task_id}")
def get_status(task_id):
    task_result = AsyncResult(task_id)
    result = {
        "task_id": task_id,
        "task_status": task_result.status,
        "task_result": task_result.result
    }
    return JSONResponse(result)


print('ok')

score = get_bert_score('https://www.loc.gov/collections/abraham-lincoln-papers/articles-and-essays/assassination-of-president-abraham-lincoln/', 'When Abraham Lincoln died and how?')
print(score)
# task = create_task.apply_async([
#     'https://www.loc.gov/collections/abraham-lincoln-papers/articles-and-essays/assassination-of-president-abraham-lincoln/',
#     'When Abraham Lincoln died and how?'
# ])
# print(task)
