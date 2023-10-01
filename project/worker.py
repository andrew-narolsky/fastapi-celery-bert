import os
from dotenv import load_dotenv
import subprocess
load_dotenv()

from bert import QA

import smtplib, ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import pandas as pd

from celery import Celery

import requests  # to read urls contents
from bs4 import BeautifulSoup  # to decode html
from bs4.element import Comment

SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = os.getenv('SMTP_PORT')
SMTP_EMAIL = os.getenv('SMTP_EMAIL')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
CLEVERR_PROXY = os.getenv('CLEVERR_PROXY')

n_best_size = 20
# Choose your model
# 'bert-large-uncased-whole-word-masking-finetuned-squad'
# 'bert-large-cased-whole-word-masking-finetuned-squad'
model = QA('bert-large-uncased-whole-word-masking-finetuned-squad', n_best_size)

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379")


@celery.task(name="create_task")
def create_task(data, email):
    get_bert_score(data, email)
    return 'OK'


# remove comments and non visible tags
def tag_visible(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True


#######################################################
# Scrap Urls only one time
#######################################################
def get_bert_score(data, email):
    print(data)
    print(email)
    result = []
    i = 1
    for item in data:
        try:
            html = subprocess.check_output(['curl', '-x', CLEVERR_PROXY, item['url']])
            soup = BeautifulSoup(html, 'html.parser')
            texts = soup.findAll(text=True)
            visible_texts = filter(tag_visible, texts)
            myBody = " ".join(t.strip() for t in visible_texts)
            myBody = myBody.strip()
            myBody = " ".join(myBody.split(" "))  # remove multiple spaces
            print(myBody)
            answer = model.predict(myBody, item['query'])
            print(answer['mean_total_prob'])
            print(answer['answers'])

            result.append({
                'url': item['url'],
                'query': item['query'],
                'bert score': answer['mean_total_prob'],
                'answers': answer['answers']
            })
        except requests.exceptions.ConnectionError:
            print("Connection refused")
            result.append({
                'url': item['url'],
                'query': item['query'],
                'bert score': 0,
                'answers': ''
            })
        i += 1

    save_file(result)
    send_mail(email)

    os.remove('result.xlsx')

    return 'done'

def save_file(arr):
    df = pd.DataFrame(arr)
    df.to_excel('result.xlsx', index=False)


def send_mail(receiver_email):

    port = SMTP_PORT
    smtp_server = SMTP_SERVER
    sender_email = SMTP_EMAIL
    password = SMTP_PASSWORD

    subject = "Your task was completed"
    body = "Your results"

    # Create a multipart message and set headers
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = subject

    # Add body to email
    message.attach(MIMEText(body, "plain"))
    filename = "result.xlsx"  # In same directory as script

    # Open PDF file in binary mode
    with open(filename, "rb") as attachment:
        # Add file as application/octet-stream
        # Email client can usually download this automatically as attachment
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment.read())

    # Encode file in ASCII characters to send by email
    encoders.encode_base64(part)

    # Add header as key/value pair to attachment part
    part.add_header(
        "Content-Disposition",
        f"attachment; filename= {filename}",
    )

    # Add attachment to message and convert message to string
    message.attach(part)
    text = message.as_string()

    # Log in to server using secure context and send email
    context = ssl.create_default_context()

    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, text)