import os
from app.tasks.celery_app import celery_app
from app.tasks.document_tasks import celery_process_document

if __name__ == "__main__":
    celery_app.start()
