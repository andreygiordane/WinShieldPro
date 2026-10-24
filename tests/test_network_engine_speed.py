import math

from backend.network_engine import NetworkEngine


def test_calculate_throughput_mbps_uses_bytes_and_elapsed_time():
    value = NetworkEngine._calculate_throughput_mbps(15_000_000, 1.0)
    assert math.isclose(value, 120.0, rel_tol=1e-9)


def test_upload_estimate_is_not_fixed_fraction_of_download():
    assert NetworkEngine._estimate_upload_mbps(120.0) < 120.0
    assert NetworkEngine._estimate_upload_mbps(120.0) > 0.0
    assert NetworkEngine._estimate_upload_mbps(0.0) == 0.0


def test_closest_server_discovery_and_haversine():
    # Testa cálculo de distância Haversine (Curitiba -> São Paulo ~338 km)
    dist = NetworkEngine._haversine_distance(-25.4284, -49.2733, -23.5505, -46.6333)
    assert 300 < dist < 400

    # Testa busca de servidor mais próximo
    closest = NetworkEngine.find_closest_server()
    assert closest is not None
    assert "name" in closest
    assert "city" in closest
    assert "distance_km" in closest
    assert closest["distance_km"] >= 0
    assert "client_isp" in closest
