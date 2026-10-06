"""
EduNexus Temporal / Progression Proxy Adapter
Directs temporal calls to the real M9 Academic Progression Engine.
"""

from analytics.progression import run_progression_analytics

def run_temporal_analytics():
    return run_progression_analytics()
