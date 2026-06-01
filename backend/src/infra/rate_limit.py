"""In-process sliding-window rate limiter for login throttling (Stage 12).

Keyed by ``username|ip``, it blocks brute-force guessing once too many failures
pile up inside the window. It is intentionally in-memory: good enough as
defense-in-depth for a single backend process, and trivially swappable for a
shared store (Redis) when scaling horizontally.
"""

from __future__ import annotations

import threading
import time


class LoginRateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int) -> None:
        self._max = max_attempts
        self._window = window_seconds
        self._lock = threading.Lock()
        self._failures: dict[str, list[float]] = {}

    def _prune(self, key: str, now: float) -> list[float]:
        recent = [t for t in self._failures.get(key, []) if now - t < self._window]
        if recent:
            self._failures[key] = recent
        else:
            self._failures.pop(key, None)
        return recent

    def is_blocked(self, key: str) -> bool:
        with self._lock:
            return len(self._prune(key, time.monotonic())) >= self._max

    def record_failure(self, key: str) -> None:
        with self._lock:
            now = time.monotonic()
            recent = self._prune(key, now)
            recent.append(now)
            self._failures[key] = recent

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)
