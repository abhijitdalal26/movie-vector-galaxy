from fastapi.testclient import TestClient
from main import app
from core.data import data_engine


def test_read_root():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "message": "Movie Vector Galaxy Backend is running"}


def test_trending_returns_503_when_data_not_ready(monkeypatch):
    with TestClient(app) as client:
        monkeypatch.setattr(data_engine, "ready", False)
        monkeypatch.setattr(data_engine, "load_error", "missing data files")
        response = client.get("/api/movies/trending")
        assert response.status_code == 503
        assert "not ready" in response.json()["detail"].lower()


def test_semantic_search_rejects_empty_query(monkeypatch):
    monkeypatch.setattr(data_engine, "ready", True)
    monkeypatch.setattr(data_engine, "load_error", None)

    with TestClient(app) as client:
        response = client.post("/api/search/semantic", json={"query": "   ", "limit": 5})
        assert response.status_code == 400
        assert response.json()["detail"] == "Query cannot be empty"


def test_semantic_search_success(monkeypatch):
    monkeypatch.setattr(data_engine, "ready", True)
    monkeypatch.setattr(data_engine, "load_error", None)
    monkeypatch.setattr(
        data_engine,
        "search_similar",
        lambda query, k=10: [{"vector_id": 1, "title": "Movie A", "similarity_distance": 0.91}],
    )

    with TestClient(app) as client:
        response = client.post("/api/search/semantic", json={"query": "mind-bending sci-fi", "limit": 1})
        assert response.status_code == 200
        payload = response.json()
        assert payload["query"] == "mind-bending sci-fi"
        assert len(payload["results"]) == 1
        assert payload["results"][0]["vector_id"] == 1
