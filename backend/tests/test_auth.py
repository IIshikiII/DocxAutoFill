"""Authentication, session and admin user-management tests (Stage 12)."""

from fastapi.testclient import TestClient

from app import app
from infra.rate_limit import LoginRateLimiter

ADMIN = {"username": "admin", "password": "admin-password-123"}


def test_login_me_logout_flow(client):
    assert client.get("/api/auth/me").status_code == 401

    login = client.post("/api/auth/login", json=ADMIN)
    assert login.status_code == 200
    assert login.json()["username"] == "admin"
    assert login.json()["role"] == "admin"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "admin"

    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401


def test_login_wrong_password_is_generic_401(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert response.status_code == 401
    # Generic message — must not reveal whether the username exists.
    assert response.json()["detail"] == "Неверный логин или пароль"


def test_login_unknown_user_is_generic_401(client):
    response = client.post("/api/auth/login", json={"username": "ghost", "password": "whatever-1"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Неверный логин или пароль"


def test_non_admin_cannot_reach_admin_routes(auth_client):
    auth_client.post("/api/admin/users", json={"username": "carol", "password": "carol-pass-1"})

    with TestClient(app) as carol:
        carol.post("/api/auth/login", json={"username": "carol", "password": "carol-pass-1"})
        assert carol.get("/api/admin/users").status_code == 403


def test_admin_creates_user_who_can_login(auth_client):
    created = auth_client.post(
        "/api/admin/users", json={"username": "dave", "password": "dave-pass-1"}
    )
    assert created.status_code == 201
    assert created.json()["role"] == "user"

    users = auth_client.get("/api/admin/users").json()
    assert any(u["username"] == "dave" for u in users)

    with TestClient(app) as dave:
        assert (
            dave.post(
                "/api/auth/login", json={"username": "dave", "password": "dave-pass-1"}
            ).status_code
            == 200
        )


def test_create_user_weak_password_rejected(auth_client):
    response = auth_client.post("/api/admin/users", json={"username": "eve", "password": "short"})
    assert response.status_code == 400


def test_duplicate_username_rejected(auth_client):
    auth_client.post("/api/admin/users", json={"username": "frank", "password": "frank-pass-1"})
    again = auth_client.post(
        "/api/admin/users", json={"username": "frank", "password": "frank-pass-2"}
    )
    assert again.status_code == 400


def test_password_reset_invalidates_sessions(auth_client):
    auth_client.post("/api/admin/users", json={"username": "grace", "password": "grace-pass-1"})
    user_id = next(
        u["id"] for u in auth_client.get("/api/admin/users").json() if u["username"] == "grace"
    )

    with TestClient(app) as grace:
        grace.post("/api/auth/login", json={"username": "grace", "password": "grace-pass-1"})
        assert grace.get("/api/auth/me").status_code == 200

        # Admin resets grace's password — grace's existing session is dropped.
        auth_client.post(f"/api/admin/users/{user_id}/password", json={"password": "grace-pass-2"})
        assert grace.get("/api/auth/me").status_code == 401

        # The new password works.
        assert (
            grace.post(
                "/api/auth/login", json={"username": "grace", "password": "grace-pass-2"}
            ).status_code
            == 200
        )


def test_admin_cannot_delete_self_or_last_admin(auth_client):
    admin_id = auth_client.get("/api/auth/me").json()["id"]
    response = auth_client.delete(f"/api/admin/users/{admin_id}")
    assert response.status_code == 400


def test_admin_deletes_user(auth_client):
    auth_client.post("/api/admin/users", json={"username": "heidi", "password": "heidi-pass-1"})
    user_id = next(
        u["id"] for u in auth_client.get("/api/admin/users").json() if u["username"] == "heidi"
    )
    assert auth_client.delete(f"/api/admin/users/{user_id}").status_code == 200
    assert all(u["username"] != "heidi" for u in auth_client.get("/api/admin/users").json())


def test_admin_can_view_and_delete_user_templates(auth_client):
    from test_templates import GRAPH

    auth_client.post("/api/admin/users", json={"username": "ivan", "password": "ivan-pass-1"})
    user_id = next(
        u["id"] for u in auth_client.get("/api/admin/users").json() if u["username"] == "ivan"
    )

    with TestClient(app) as ivan:
        ivan.post("/api/auth/login", json={"username": "ivan", "password": "ivan-pass-1"})
        ivan.post("/api/templates", json={"name": "Шаблон Ивана", "graph": GRAPH})

    templates = auth_client.get(f"/api/admin/users/{user_id}/templates").json()
    assert len(templates) == 1
    assert templates[0]["name"] == "Шаблон Ивана"

    template_id = templates[0]["id"]
    assert auth_client.delete(f"/api/admin/templates/{template_id}").status_code == 200
    assert auth_client.get(f"/api/admin/users/{user_id}/templates").json() == []


def test_rate_limiter_blocks_after_max_attempts():
    limiter = LoginRateLimiter(max_attempts=3, window_seconds=300)
    key = "user|1.2.3.4"
    assert not limiter.is_blocked(key)
    for _ in range(3):
        limiter.record_failure(key)
    assert limiter.is_blocked(key)
    limiter.reset(key)
    assert not limiter.is_blocked(key)
