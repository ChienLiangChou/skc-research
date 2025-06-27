import httpx

def test_health_check():
    response = httpx.get("http://localhost:2024/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}