from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_openapi_documents_api_routes() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert document["info"]["title"] == "Expense Tracker API"
    assert "/api/v1/auth/login" in document["paths"]
    assert "/api/v1/transactions" in document["paths"]
