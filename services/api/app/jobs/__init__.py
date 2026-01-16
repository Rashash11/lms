"""
Celery Application Configuration

Replaces BullMQ with Celery + Redis for background job processing.
This module creates and configures the Celery application with:
- Redis as broker and result backend
- 8 task queues matching the BullMQ structure
- Retry policies and result expiration
"""

from celery import Celery

from app.config import get_settings

settings = get_settings()

# Get Redis URL from settings or use default
REDIS_URL = getattr(settings, "redis_url", "redis://localhost:6379/0")

# Create Celery application
celery_app = Celery(
    "lms",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.jobs.tasks"],  # Auto-discover tasks
)

# ============= Celery Configuration =============
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_acks_late=True,  # Acknowledge after task completion (not before)
    task_reject_on_worker_lost=True,  # Requeue if worker dies
    task_track_started=True,  # Track when tasks start
    
    # Result backend
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store extended task info
    
    # Worker configuration
    worker_prefetch_multiplier=1,  # Prefetch one task at a time
    worker_concurrency=4,  # Default concurrency
    
    # Queue routing (matches BullMQ queue names)
    task_routes={
        "app.jobs.tasks.send_*": {"queue": "email"},
        "app.jobs.tasks.notify_*": {"queue": "notification"},
        "app.jobs.tasks.certificate_*": {"queue": "certificate"},
        "app.jobs.tasks.report_*": {"queue": "report"},
        "app.jobs.tasks.import_*": {"queue": "import"},
        "app.jobs.tasks.gamification_*": {"queue": "gamification"},
        "app.jobs.tasks.timeline_*": {"queue": "timeline"},
        "app.jobs.tasks.automation_*": {"queue": "automation"},
    },
    
    # Default queue
    task_default_queue="default",
    
    # Task time limits
    task_soft_time_limit=300,  # 5 minutes soft limit
    task_time_limit=600,  # 10 minutes hard limit
    
    # Error handling
    task_annotations={
        "*": {
            "rate_limit": "100/s",  # Global rate limit
        }
    },
)

# ============= Queue Definitions =============
# These match the BullMQ QUEUE_NAMES in src/lib/jobs/queues.ts

QUEUE_NAMES = {
    "EMAIL": "email",
    "NOTIFICATION": "notification",
    "CERTIFICATE": "certificate",
    "REPORT": "report",
    "IMPORT": "import",
    "GAMIFICATION": "gamification",
    "TIMELINE": "timeline",
    "AUTOMATION": "automation",
}

# Default retry policies per queue (matches BullMQ DEFAULT_JOB_OPTIONS)
RETRY_POLICIES = {
    "email": {"max_retries": 3, "retry_backoff": True, "retry_backoff_max": 600},
    "notification": {"max_retries": 3, "retry_backoff": True, "retry_backoff_max": 300},
    "certificate": {"max_retries": 3, "retry_backoff": True, "retry_backoff_max": 600},
    "report": {"max_retries": 2, "retry_backoff": False, "countdown": 30},
    "import": {"max_retries": 1, "retry_backoff": False},  # Imports don't auto-retry
    "gamification": {"max_retries": 3, "retry_backoff": True, "retry_backoff_max": 60},
    "timeline": {"max_retries": 2, "retry_backoff": True, "retry_backoff_max": 60},
    "automation": {"max_retries": 2, "retry_backoff": True, "retry_backoff_max": 300},
}


__all__ = [
    "celery_app",
    "QUEUE_NAMES",
    "RETRY_POLICIES",
]
