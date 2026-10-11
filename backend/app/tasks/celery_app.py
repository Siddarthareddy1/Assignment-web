from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "studypath_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,  # 30 min hard limit for large documents
    task_soft_time_limit=1500, # 25 min soft limit
    worker_concurrency=4
)
