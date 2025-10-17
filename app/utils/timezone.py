"""
South African timezone utilities
SAST = UTC+2 (South Africa Standard Time)
"""
from datetime import datetime, timedelta


def get_sa_time():
    """Get current time in South African timezone (SAST - UTC+2)"""
    utc_now = datetime.utcnow()
    sast_now = utc_now + timedelta(hours=2)
    return sast_now


def to_sa_time(utc_datetime):
    """Convert UTC datetime to South African time"""
    if utc_datetime is None:
        return None
    return utc_datetime + timedelta(hours=2)
