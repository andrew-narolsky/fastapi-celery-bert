import os
from bert import QA

from celery import Celery

import googlesearch
import random
import re
import sys  # for sys variables

import requests  # to read urls contents
from bs4 import BeautifulSoup  # to decode html
from bs4.element import Comment

n_best_size = 20
# Choose your model
# 'bert-large-uncased-whole-word-masking-finetuned-squad'
# 'bert-large-cased-whole-word-masking-finetuned-squad'
model = QA('bert-large-uncased-whole-word-masking-finetuned-squad', n_best_size)


celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379")


@celery.task(name="create_task")
def create_task(url, query):
    score = get_bert_score(url, query)
    return score


###############################################
#  Search in Google  and scrap Urls
###############################################
def get_result(myKeyword):
    myNum = 10
    myStart = 0
    myStop = 10  # get by ten
    myMaxStart = 30  # only 30 pages
    myLowPause = 5
    myHighPause = 15
    myTLD = "com"  # Google tld   -> we search in google.com
    myHl = "en"  # in english
    i = 1
    PAGES_LIMIT=10

    extensions_stop_list = (
        '.7z', '.aac', '.au', '.avi', '.bmp', '.bzip', '.css', '.doc',
        '.docx', '.flv', '.gif', '.gz', '.gzip', '.ico', '.jpg', '.jpeg',
        '.js', '.mov', '.mp3', '.mp4', '.mpeg', '.mpg', '.odb', '.odf',
        '.odg', '.odp', '.ods', '.odt', '.pdf', '.png', '.ppt', '.pptx',
        '.psd', '.rar', '.swf', '.tar', '.tgz', '.txt', '.wav', '.wmv',
        '.xls', '.xlsx', '.xml', '.z', '.zip'
    )

    pages = {}

    # this may be long
    while myStart < myMaxStart:
        print("PASSAGE NUMBER :" + str(myStart))
        print("Query:" + myKeyword)
        # change user-agent and pause to avoid blocking by Google
        myPause = random.randint(myLowPause, myHighPause)  # long pause
        print("Pause:" + str(myPause))
        # change user_agent  and provide local language in the User Agent
        myUserAgent = googlesearch.get_random_user_agent()
        print("UserAgent:" + str(myUserAgent))
        try:
            urls = googlesearch.search(
                query=myKeyword,
                tld=myTLD,
                lang=myHl,
                safe='off',
                num=myNum,
                start=myStart,
                stop=myStop,
                pause=myPause,
                user_agent=myUserAgent
            )

            for url in urls:

                if i > PAGES_LIMIT:
                    return pages

                url = re.sub(r'(?is)\?(.)+', '', url)
                print(url)
                ext = re.search(r'\.(.){2,3}$', url)
                if ext and ext.group(0) in extensions_stop_list:
                    continue
                task = create_task.apply_async([url, myKeyword])
                arr = {'url': url, 'task_id': task.id}
                pages[i] = arr
                i += 1
            myStart += 10
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            print("ERROR")
            print(exc_type.__name__)
            print(exc_value)
            print(exc_traceback)
            break

    return pages


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
def get_bert_score(url, myKeyword):
    mean_total_prob = False
    # change user_agent  and provide local language in the User Agent
    myUserAgent = googlesearch.get_random_user_agent()
    print("UserAgent:" + str(myUserAgent))
    headers = {'User-Agent': myUserAgent}
    try:
        r = requests.get(url, timeout=(5, 14), headers=headers)
        if r.status_code == 200.:  # can't decode utf-7
            soup = BeautifulSoup(r.text, 'html.parser')
            texts = soup.findAll(text=True)
            visible_texts = filter(tag_visible, texts)
            myBody = " ".join(t.strip() for t in visible_texts)
            myBody = myBody.strip()
            myBody = " ".join(myBody.split(" "))  # remove multiple spaces
            # print(myBody)
            # mean_total_prob = myKeyword
            answer = model.predict(myBody, myKeyword)
            # mean_total_prob = str([answer['mean_total_prob'], answer['answers']])
            mean_total_prob = {
                'score': answer['mean_total_prob'],
                'answers': answer['answers']
            }
            print(answer['mean_total_prob'])
            print(answer['answers'])
            print(mean_total_prob)
    except requests.exceptions.ConnectionError:
        mean_total_prob = "Connection refused"
        print("Connection refused")

    return mean_total_prob
