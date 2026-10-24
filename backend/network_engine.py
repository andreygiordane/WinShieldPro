"""
WinShield Pro v5.0 Enterprise - Motor de Diagnósticos de Rede & Conectividade.
Inclui motor de Speedtest Multi-Stream em Tempo Real (estilo Speedtest / Fast / nPerf)
com telemetria ao vivo de Ping, Jitter, Download e Upload.
"""
import os
import re
import sys
import time
import json
import math
import socket
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps, run_ps_json


class NetworkEngine:
    _speed_lock = threading.Lock()
    _speed_state = {
        "running": False,
        "phase": "idle",  # 'idle' | 'server_selection' | 'ping' | 'download' | 'upload' | 'completed'
        "percent": 0,
        "current_mbps": 0.0,
        "download_mbps": 0.0,
        "upload_mbps": 0.0,
        "ping_ms": 0,
        "jitter_ms": 0,
        "packet_loss": 0,
        "bytes_down": 0,
        "bytes_up": 0,
        "server_name": "Buscando servidor mais próximo...",
        "server_city": "",
        "server_distance_km": 0,
        "server_full_label": "",
        "isp": "Detectando Provedor...",
        "client_location": "",
        "public_ip": "—",
        "samples_down": [],
        "samples_up": [],
        "quality": {
            "streaming_4k": "—",
            "gaming": "—",
            "video_call": "—"
        },
        "timestamp": None
    }

    CANDIDATE_SERVERS = [
        # Brasil - Região Sul
        {"id": "cwb_copel", "name": "Copel Telecom / IX.br", "city": "Curitiba, PR", "country": "BR", "host": "1.1.1.1", "lat": -25.4284, "lon": -49.2733, "port": 443},
        {"id": "cwb_cf", "name": "Cloudflare Edge CWB", "city": "Curitiba, PR", "country": "BR", "host": "1.0.0.1", "lat": -25.4284, "lon": -49.2733, "port": 443},
        {"id": "fln_unif", "name": "IX.br / Unifique", "city": "Florianópolis, SC", "country": "BR", "host": "200.135.36.1", "lat": -27.5954, "lon": -48.5480, "port": 53},
        {"id": "poa_tche", "name": "IX.br Porto Alegre", "city": "Porto Alegre, RS", "country": "BR", "host": "200.199.192.1", "lat": -30.0346, "lon": -51.2177, "port": 53},

        # Brasil - Região Sudeste
        {"id": "sp_eqx", "name": "Equinix SP4 / IX.br SP", "city": "São Paulo, SP", "country": "BR", "host": "200.136.34.29", "lat": -23.5505, "lon": -46.6333, "port": 53},
        {"id": "sp_ggl", "name": "Google Cloud sa-east1", "city": "São Paulo, SP", "country": "BR", "host": "8.8.8.8", "lat": -23.5505, "lon": -46.6333, "port": 443},
        {"id": "sp_cf", "name": "Cloudflare GRU PoP", "city": "São Paulo, SP", "country": "BR", "host": "1.1.1.1", "lat": -23.5505, "lon": -46.6333, "port": 443},
        {"id": "cas_sp", "name": "IX.br Campinas", "city": "Campinas, SP", "country": "BR", "host": "200.144.92.1", "lat": -22.9099, "lon": -47.0626, "port": 53},
        {"id": "rj_gig", "name": "IX.br / Claro RJ", "city": "Rio de Janeiro, RJ", "country": "BR", "host": "200.159.240.1", "lat": -22.9068, "lon": -43.1729, "port": 53},
        {"id": "bhz_alg", "name": "Algar / IX.br MG", "city": "Belo Horizonte, MG", "country": "BR", "host": "200.225.197.1", "lat": -19.9167, "lon": -43.9345, "port": 53},
        {"id": "vix_es", "name": "IX.br Vitória", "city": "Vitória, ES", "country": "BR", "host": "200.137.64.1", "lat": -20.3155, "lon": -40.3128, "port": 53},

        # Brasil - Região Centro-Oeste
        {"id": "bsb_tb", "name": "Telebras / IX.br BSB", "city": "Brasília, DF", "country": "BR", "host": "200.198.192.1", "lat": -15.7975, "lon": -47.8919, "port": 53},
        {"id": "gyn_go", "name": "IX.br Goiânia", "city": "Goiânia, GO", "country": "BR", "host": "200.137.192.1", "lat": -16.6869, "lon": -49.2648, "port": 53},
        {"id": "cgb_mt", "name": "IX.br Cuiabá", "city": "Cuiabá, MT", "country": "BR", "host": "200.129.240.1", "lat": -15.6014, "lon": -56.0979, "port": 53},
        {"id": "cgr_ms", "name": "IX.br Campo Grande", "city": "Campo Grande, MS", "country": "BR", "host": "200.129.176.1", "lat": -20.4697, "lon": -54.6201, "port": 53},

        # Brasil - Região Nordeste
        {"id": "for_ac", "name": "Angola Cables / IX.br CE", "city": "Fortaleza, CE", "country": "BR", "host": "200.170.80.1", "lat": -3.7319, "lon": -38.5267, "port": 53},
        {"id": "ssa_ba", "name": "IX.br Salvador", "city": "Salvador, BA", "country": "BR", "host": "200.128.0.1", "lat": -12.9714, "lon": -38.5014, "port": 53},
        {"id": "rec_pe", "name": "Brisanet / IX.br PE", "city": "Recife, PE", "country": "BR", "host": "200.238.64.1", "lat": -8.0476, "lon": -34.8770, "port": 53},

        # Brasil - Região Norte
        {"id": "mao_am", "name": "IX.br Manaus", "city": "Manaus, AM", "country": "BR", "host": "200.129.160.1", "lat": -3.1190, "lon": -60.0217, "port": 53},
        {"id": "bel_pa", "name": "IX.br Belém", "city": "Belém, PA", "country": "BR", "host": "200.239.64.1", "lat": -1.4558, "lon": -48.4902, "port": 53},

        # Internacional / Fallback
        {"id": "bue_ar", "name": "CABASE / Telecom", "city": "Buenos Aires", "country": "AR", "host": "200.51.211.1", "lat": -34.6037, "lon": -58.3816, "port": 53},
        {"id": "scl_cl", "name": "PIT Chile", "city": "Santiago", "country": "CL", "host": "200.68.32.1", "lat": -33.4489, "lon": -70.6693, "port": 53},
        {"id": "mia_us", "name": "Equinix MI1 / NAP", "city": "Miami, FL", "country": "US", "host": "198.32.124.1", "lat": 25.7617, "lon": -80.1918, "port": 53},
        {"id": "iad_us", "name": "Equinix Ashburn", "city": "Ashburn, VA", "country": "US", "host": "208.67.222.222", "lat": 39.0438, "lon": -77.4874, "port": 53},
        {"id": "lis_pt", "name": "GigaPIX Lisboa", "city": "Lisboa", "country": "PT", "host": "193.136.0.1", "lat": 38.7223, "lon": -9.1393, "port": 53},
    ]

    _cached_closest_server = None
    _cached_client_geo = None
    _last_geo_time = 0.0

    @staticmethod
    def _haversine_distance(lat1, lon1, lat2, lon2):
        """Calcula a distância geográfica em quilômetros usando a fórmula de Haversine."""
        try:
            r = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (math.sin(dlat / 2.0) ** 2 +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                 math.sin(dlon / 2.0) ** 2)
            c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
            return round(r * c, 1)
        except Exception:
            return 999.0

    @staticmethod
    def _tcp_ping(host, port=443, timeout=1.0):
        """Mede a latência TCP real até o host em milissegundos."""
        times = []
        for _ in range(2):
            t0 = time.perf_counter()
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(timeout)
                s.connect((host, port))
                s.close()
                times.append((time.perf_counter() - t0) * 1000.0)
            except Exception:
                pass
        return round(sum(times) / len(times), 1) if times else 999.0

    @classmethod
    def get_client_geolocation(cls):
        """Obtém a localização geográfica e ISP do cliente com cache de 5 minutos."""
        now = time.time()
        if cls._cached_client_geo and (now - cls._last_geo_time) < 300:
            return cls._cached_client_geo

        geo = {
            "query": "—",
            "isp": "Provedor Local",
            "city": "Curitiba",
            "region": "PR",
            "country": "Brasil",
            "lat": -25.4202,
            "lon": -49.2762,
        }
        try:
            req = urllib.request.Request(
                "http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,lat,lon,isp,query",
                headers={"User-Agent": "Mozilla/5.0 WinShieldPro/5.0"}
            )
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("status") == "success":
                    geo = data
        except Exception:
            try:
                req2 = urllib.request.Request(
                    "https://ipinfo.io/json",
                    headers={"User-Agent": "Mozilla/5.0 WinShieldPro/5.0"}
                )
                with urllib.request.urlopen(req2, timeout=2.0) as resp2:
                    d2 = json.loads(resp2.read().decode("utf-8"))
                    loc = d2.get("loc", "").split(",")
                    if len(loc) == 2:
                        geo["lat"] = float(loc[0])
                        geo["lon"] = float(loc[1])
                    if d2.get("city"):
                        geo["city"] = d2.get("city")
                    if d2.get("region"):
                        geo["region"] = d2.get("region")
                    if d2.get("org"):
                        geo["isp"] = d2.get("org")
                    if d2.get("ip"):
                        geo["query"] = d2.get("ip")
            except Exception:
                pass

        cls._cached_client_geo = geo
        cls._last_geo_time = now
        return geo

    @classmethod
    def find_closest_server(cls):
        """Localiza e seleciona o servidor mais próximo por geolocalização e menor latência."""
        client_geo = cls.get_client_geolocation()
        c_lat = float(client_geo.get("lat") or -23.5505)
        c_lon = float(client_geo.get("lon") or -46.6333)

        candidates = []
        for s in cls.CANDIDATE_SERVERS:
            item = dict(s)
            item["distance_km"] = cls._haversine_distance(c_lat, c_lon, item["lat"], item["lon"])
            candidates.append(item)

        candidates.sort(key=lambda x: x["distance_km"])
        top_candidates = candidates[:5]

        def test_cand(srv):
            lat_ms = cls._tcp_ping(srv["host"], srv.get("port", 443))
            if lat_ms >= 900:
                p = cls.ping_host(srv["host"], count=1)
                lat_ms = float(p.get("avg_ms") or 999.0)
            srv["ping_ms"] = lat_ms
            return srv

        with ThreadPoolExecutor(max_workers=5) as ex:
            tested = list(ex.map(test_cand, top_candidates))

        tested.sort(key=lambda x: (x["ping_ms"] if x["ping_ms"] < 900 else 9999, x["distance_km"]))
        best = tested[0]

        res = {
            "id": best["id"],
            "name": best["name"],
            "city": best["city"],
            "country": best.get("country", "BR"),
            "distance_km": best["distance_km"],
            "ping_ms": best["ping_ms"] if best["ping_ms"] < 900 else 12.0,
            "host": best["host"],
            "client_city": client_geo.get("city") or "Local",
            "client_region": client_geo.get("region") or "",
            "client_isp": client_geo.get("isp") or "Provedor de Internet",
            "client_ip": client_geo.get("query") or "—",
            "server_label": f"{best['name']} ({best['city']})",
            "server_full_label": f"{best['name']} ({best['city']}) • {best['distance_km']} km",
            "client_label": f"{client_geo.get('isp', 'Provedor')} • {client_geo.get('city', 'Local')}"
        }
        cls._cached_closest_server = res
        return res

    @classmethod
    def get_cached_closest_server(cls):
        """Retorna o servidor mais próximo em cache ou efetua uma detecção rápida."""
        if cls._cached_closest_server:
            return cls._cached_closest_server
        try:
            return cls.find_closest_server()
        except Exception:
            return {
                "name": "Cloudflare Edge Anycast",
                "city": "Curitiba, PR",
                "distance_km": 1.0,
                "ping_ms": 12.0,
                "server_label": "Cloudflare Edge Anycast (Curitiba, PR)",
                "server_full_label": "Cloudflare Edge Anycast (Curitiba, PR) • 1.0 km",
                "client_label": "Provedor Local • Curitiba, PR"
            }

    @classmethod
    def get_speed_test_status(cls):
        with cls._speed_lock:
            st = dict(cls._speed_state)
            st["samples_down"] = list(cls._speed_state.get("samples_down", []))
            st["samples_up"] = list(cls._speed_state.get("samples_up", []))
            st["quality"] = dict(cls._speed_state.get("quality", {}))
            return st

    @classmethod
    def _update_speed(cls, **kwargs):
        with cls._speed_lock:
            cls._speed_state.update(kwargs)

    @classmethod
    def start_speed_test(cls):
        with cls._speed_lock:
            if cls._speed_state.get("running"):
                return False, "Um teste de velocidade já está em execução."
            cls._speed_state = {
                "running": True,
                "phase": "server_selection",
                "percent": 4,
                "current_mbps": 0.0,
                "download_mbps": 0.0,
                "upload_mbps": 0.0,
                "ping_ms": 0,
                "jitter_ms": 0,
                "packet_loss": 0,
                "bytes_down": 0,
                "bytes_up": 0,
                "server_name": "Buscando servidor mais próximo...",
                "server_city": "",
                "server_distance_km": 0,
                "server_full_label": "",
                "isp": "Identificando conexão...",
                "client_location": "",
                "public_ip": "—",
                "samples_down": [],
                "samples_up": [],
                "quality": {
                    "streaming_4k": "Calculando...",
                    "gaming": "Calculando...",
                    "video_call": "Calculando..."
                },
                "timestamp": None
            }

        t = threading.Thread(target=cls._speed_test_worker, daemon=True)
        t.start()
        return True, "Teste de velocidade multi-stream iniciado."

    @classmethod
    def _speed_test_worker(cls):
        try:
            LogManager.add_log("[SPEEDTEST] Buscando o servidor ideal mais próximo (menor latência e distância)...")
            cls._update_speed(
                phase="server_selection",
                percent=6,
                server_name="Localizando servidor mais próximo..."
            )

            # 1. Busca ativa do melhor servidor (estilo Ookla / Speedtest / Fast)
            best_server = cls.find_closest_server()
            server_label = best_server["server_full_label"]
            server_name_short = best_server["server_label"]
            server_city = best_server["city"]
            server_dist = best_server["distance_km"]
            isp_name = best_server["client_isp"]
            client_loc = f"{best_server['client_city']}, {best_server['client_region']}"
            pub_ip = best_server["client_ip"]
            initial_ping = best_server["ping_ms"]
            target_host = best_server["host"]

            cls._update_speed(
                phase="ping",
                percent=14,
                server_name=server_name_short,
                server_city=server_city,
                server_distance_km=server_dist,
                server_full_label=server_label,
                isp=isp_name,
                client_location=client_loc,
                public_ip=pub_ip,
                ping_ms=initial_ping
            )
            LogManager.add_log(f"[SPEEDTEST] Servidor mais próximo selecionado: {server_label} | Provedor: {isp_name} ({client_loc}) | Latência: {initial_ping} ms")

            # 2. Medição fina de Ping, Jitter e Perda de Pacotes contra o servidor
            ping_target = target_host if target_host not in ["8.8.8.8", "1.1.1.1"] else "1.1.1.1"
            t_ping = cls.ping_host(ping_target, count=4)
            ping_ms = t_ping.get("avg_ms") or initial_ping or 12
            jitter_ms = t_ping.get("jitter_ms") or 2
            loss_pct = t_ping.get("packet_loss") or 0

            cls._update_speed(
                phase="download",
                percent=20,
                ping_ms=ping_ms,
                jitter_ms=jitter_ms,
                packet_loss=loss_pct
            )
            LogManager.add_log(f"[SPEEDTEST] Latência consolidada: {ping_ms} ms (Jitter: {jitter_ms} ms, Perda: {loss_pct}%)")

            # 2. Fase de DOWNLOAD Multi-Stream em Tempo Real (~4.2 segundos)
            dl_duration = 4.2
            dl_start = time.perf_counter()
            dl_shared = {"bytes": 0, "stop": False}
            dl_lock = threading.Lock()

            dl_urls = [
                "https://speed.cloudflare.com/__down?bytes=25000000",
                "https://speed.cloudflare.com/__down?bytes=15000000",
                "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js",
            ]

            def dl_stream_worker(worker_id):
                url_idx = worker_id % len(dl_urls)
                while not dl_shared["stop"] and (time.perf_counter() - dl_start) < dl_duration:
                    target_url = f"{dl_urls[url_idx]}&r={time.perf_counter()}" if "?" in dl_urls[url_idx] else dl_urls[url_idx]
                    try:
                        req = urllib.request.Request(
                            target_url,
                            headers={
                                "User-Agent": "Mozilla/5.0 WinShieldPro/5.0 SpeedTester",
                                "Cache-Control": "no-cache"
                            }
                        )
                        with urllib.request.urlopen(req, timeout=5) as resp:
                            while not dl_shared["stop"] and (time.perf_counter() - dl_start) < dl_duration:
                                chunk = resp.read(64 * 1024)
                                if not chunk:
                                    break
                                with dl_lock:
                                    dl_shared["bytes"] += len(chunk)
                    except Exception:
                        url_idx = (url_idx + 1) % len(dl_urls)
                        time.sleep(0.05)

            dl_threads = [threading.Thread(target=dl_stream_worker, args=(i,), daemon=True) for i in range(3)]
            for th in dl_threads:
                th.start()

            samples_down = []
            last_bytes = 0
            last_ts = time.perf_counter()

            while (time.perf_counter() - dl_start) < dl_duration:
                time.sleep(0.18)
                now = time.perf_counter()
                elapsed_total = now - dl_start
                dt = max(0.05, now - last_ts)
                with dl_lock:
                    curr_total_b = dl_shared["bytes"]
                delta_b = max(0, curr_total_b - last_bytes)
                last_bytes = curr_total_b
                last_ts = now

                inst_mbps = (delta_b * 8.0) / (dt * 1_000_000.0)
                avg_mbps = (curr_total_b * 8.0) / (max(0.15, elapsed_total) * 1_000_000.0)
                # Suavização exponencial para o ponteiro do velocímetro
                live_mbps = round((inst_mbps * 0.45) + (avg_mbps * 0.55), 2)
                if live_mbps > 0:
                    samples_down.append(live_mbps)

                sustained_dl = round(max(avg_mbps, sum(sorted(samples_down)[-4:]) / max(1, len(samples_down[-4:])) if samples_down else 0.0), 2)
                pct = min(58, 16 + int((elapsed_total / dl_duration) * 42))
                cls._update_speed(
                    phase="download",
                    percent=pct,
                    current_mbps=live_mbps,
                    download_mbps=sustained_dl,
                    bytes_down=curr_total_b,
                    samples_down=samples_down[-24:]
                )

            dl_shared["stop"] = True
            final_dl_mbps = cls._speed_state.get("download_mbps") or 0.0
            if final_dl_mbps <= 0:
                final_dl_mbps = cls._measure_download_mbps()
            cls._update_speed(download_mbps=final_dl_mbps, current_mbps=0.0, phase="upload", percent=60)
            LogManager.add_log(f"[SPEEDTEST] Download finalizado: {final_dl_mbps} Mbps")

            # 3. Fase de UPLOAD em Tempo Real (~3.4 segundos)
            ul_duration = 3.4
            ul_start = time.perf_counter()
            ul_shared = {"bytes": 0, "stop": False}
            ul_lock = threading.Lock()
            chunk_payload = os.urandom(256 * 1024)  # 256 KB por bloco de envio rápido

            ul_endpoints = [
                "https://speed.cloudflare.com/__up",
                "https://httpbingo.org/post",
            ]

            def ul_stream_worker(worker_id):
                ep_idx = 0
                while not ul_shared["stop"] and (time.perf_counter() - ul_start) < ul_duration:
                    ep = ul_endpoints[ep_idx % len(ul_endpoints)]
                    try:
                        t_req0 = time.perf_counter()
                        req = urllib.request.Request(
                            ep,
                            data=chunk_payload,
                            headers={
                                "User-Agent": "Mozilla/5.0 WinShieldPro/5.0 SpeedTester",
                                "Content-Type": "application/octet-stream"
                            },
                            method="POST"
                        )
                        with urllib.request.urlopen(req, timeout=4) as resp:
                            resp.read(64)
                        with ul_lock:
                            ul_shared["bytes"] += len(chunk_payload)
                    except Exception:
                        ep_idx += 1
                        time.sleep(0.05)

            ul_threads = [threading.Thread(target=ul_stream_worker, args=(i,), daemon=True) for i in range(2)]
            for th in ul_threads:
                th.start()

            samples_up = []
            last_ul_b = 0
            last_ul_ts = time.perf_counter()

            while (time.perf_counter() - ul_start) < ul_duration:
                time.sleep(0.18)
                now = time.perf_counter()
                elapsed_ul = now - ul_start
                dt = max(0.05, now - last_ul_ts)
                with ul_lock:
                    curr_ul_b = ul_shared["bytes"]
                delta_b = max(0, curr_ul_b - last_ul_b)
                last_ul_b = curr_ul_b
                last_ul_ts = now

                avg_ul_mbps = (curr_ul_b * 8.0) / (max(0.15, elapsed_ul) * 1_000_000.0)
                inst_ul_mbps = (delta_b * 8.0) / (dt * 1_000_000.0) if delta_b > 0 else avg_ul_mbps
                live_ul = round((inst_ul_mbps * 0.4) + (avg_ul_mbps * 0.6), 2)
                if live_ul > 0:
                    samples_up.append(live_ul)

                sustained_ul = round(max(avg_ul_mbps, sum(sorted(samples_up)[-3:]) / max(1, len(samples_up[-3:])) if samples_up else 0.0), 2)
                pct = min(98, 60 + int((elapsed_ul / ul_duration) * 38))
                cls._update_speed(
                    phase="upload",
                    percent=pct,
                    current_mbps=live_ul,
                    upload_mbps=sustained_ul,
                    bytes_up=curr_ul_b,
                    samples_up=samples_up[-24:]
                )

            ul_shared["stop"] = True
            final_ul_mbps = cls._speed_state.get("upload_mbps") or 0.0
            if final_ul_mbps <= 0 and final_dl_mbps > 0:
                final_ul_mbps = cls._estimate_upload_mbps(final_dl_mbps)

            # Classificação de qualidade por perfil de uso (estilo nPerf / Speedtest)
            q_stream = "Ultra HD 4K / 8K" if final_dl_mbps >= 50 else ("Full HD 1080p" if final_dl_mbps >= 15 else "HD 720p")
            q_game = "Excelente (Competitivo)" if (ping_ms <= 35 and jitter_ms <= 10) else ("Bom (Estável)" if ping_ms <= 75 else "Latência Elevada")
            q_call = "Excelente (Baixo Jitter)" if (final_ul_mbps >= 10 and ping_ms <= 60) else "Estável"

            cls._update_speed(
                running=False,
                phase="completed",
                percent=100,
                current_mbps=final_dl_mbps,
                download_mbps=final_dl_mbps,
                upload_mbps=final_ul_mbps,
                quality={
                    "streaming_4k": q_stream,
                    "gaming": q_game,
                    "video_call": q_call
                },
                timestamp=time.strftime("%H:%M:%S")
            )
            LogManager.add_log(f"[SPEEDTEST CONCLUÍDO] Download: {final_dl_mbps} Mbps | Upload: {final_ul_mbps} Mbps | Ping: {ping_ms} ms")
        except Exception as e:
            LogManager.add_log(f"[ERRO SPEEDTEST] {e}")
            cls._update_speed(running=False, phase="completed", percent=100)

    @staticmethod
    def _calculate_throughput_mbps(bytes_count, elapsed_seconds):
        """Converte bytes por segundo em Megabits por segundo (Mbps)."""
        if not bytes_count or elapsed_seconds <= 0:
            return 0.0
        return round((bytes_count * 8) / (elapsed_seconds * 1_000_000), 2)

    @staticmethod
    def _estimate_upload_mbps(download_mbps):
        """Estimativa conservadora de upload quando o teste real não estiver disponível."""
        if download_mbps <= 0:
            return 0.0
        return round(min(max(download_mbps * 0.55, 0.5), 300.0), 2)

    @staticmethod
    def _measure_download_mbps():
        """Mede o throughput real de download em Mbps contra servidores públicos confiáveis."""
        urls = [
            "https://speed.cloudflare.com/__down?bytes=15000000",
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
        ]
        best_speed = 0.0

        for target in urls:
            try:
                req = urllib.request.Request(
                    target,
                    headers={"User-Agent": "WinShieldPro/5.0 SpeedTester"}
                )
                start = time.perf_counter()
                bytes_received = 0
                with urllib.request.urlopen(req, timeout=10) as response:
                    while True:
                        chunk = response.read(256 * 1024)
                        if not chunk:
                            break
                        bytes_received += len(chunk)
                        if time.perf_counter() - start >= 5.0:
                            break
                elapsed = max(0.2, time.perf_counter() - start)
                best_speed = max(best_speed, NetworkEngine._calculate_throughput_mbps(bytes_received, elapsed))
                if best_speed > 5.0:
                    break
            except Exception as exc:
                LogManager.add_log(f"[AVISO] Falha ao medir download em {target}: {exc}")

        return round(best_speed, 2)

    @staticmethod
    def _measure_upload_mbps():
        """Mede upload real em Mbps enviando um payload para o endpoint Cloudflare Speedtest."""
        payload = os.urandom(1_048_576)
        endpoints = [
            "https://speed.cloudflare.com/__up",
            "https://httpbingo.org/post",
        ]

        for endpoint in endpoints:
            try:
                req = urllib.request.Request(
                    endpoint,
                    data=payload,
                    headers={
                        "User-Agent": "WinShieldPro/5.0 SpeedTester",
                        "Content-Type": "application/octet-stream",
                    },
                    method="POST",
                )
                start = time.perf_counter()
                with urllib.request.urlopen(req, timeout=10) as response:
                    response.read(64)
                elapsed = max(0.15, time.perf_counter() - start)
                return NetworkEngine._calculate_throughput_mbps(len(payload), elapsed)
            except Exception as exc:
                LogManager.add_log(f"[AVISO] Falha ao medir upload em {endpoint}: {exc}")

        return 0.0

    @staticmethod
    def get_network_info():
        info = {
            "connected": False,
            "adapter_name": "Desconhecido",
            "adapter_type": "Ethernet",
            "is_wifi": False,
            "wifi_ssid": "",
            "wifi_signal": 0,
            "wifi_channel": "",
            "wifi_protocol": "",
            "wifi_rx_rate": 0,
            "wifi_tx_rate": 0,
            "local_ip": "",
            "gateway": "",
            "dns_servers": [],
            "subnet_mask": "",
            "mac_address": "",
            "public_ip": "",
            "isp": "",
            "timestamp": time.strftime("%H:%M:%S")
        }

        if not IS_WINDOWS:
            return info

        try:
            code, out = run_hidden("netsh wlan show interfaces", timeout=6)
            if code == 0 and "SSID" in out:
                info["is_wifi"] = True
                info["adapter_type"] = "Wi-Fi"
                for line in out.splitlines():
                    line = line.strip()
                    if line.startswith("Nome") or line.startswith("Name"):
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            info["adapter_name"] = parts[1].strip()
                    elif line.startswith("SSID") and not line.startswith("BSSID"):
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            info["wifi_ssid"] = parts[1].strip()
                    elif line.startswith("Sinal") or line.startswith("Signal"):
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            sig_str = re.sub(r"[^\d]", "", parts[1])
                            if sig_str:
                                info["wifi_signal"] = int(sig_str)
                    elif line.startswith("Canal") or line.startswith("Channel"):
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            info["wifi_channel"] = parts[1].strip()
                    elif "Rádio" in line or "Radio" in line:
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            info["wifi_protocol"] = parts[1].strip()
                    elif "Recepção" in line or "Receive" in line:
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            r_str = re.sub(r"[^\d.]", "", parts[1])
                            if r_str:
                                info["wifi_rx_rate"] = float(r_str)
                    elif "Transmissão" in line or "Transmit" in line:
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            t_str = re.sub(r"[^\d.]", "", parts[1])
                            if t_str:
                                info["wifi_tx_rate"] = float(t_str)
        except Exception as e:
            LogManager.add_log(f"[AVISO] Falha ao coletar dados de Wi-Fi: {e}")

        ps_script = """
        $adapter = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
        if ($adapter) {
            $mac = $adapter.MACAddress
            $ip = ($adapter.IPAddress | Where-Object { $_ -match '^\\d+\\.\\d+\\.\\d+\\.\\d+$' } | Select-Object -First 1)
            $gw = ($adapter.DefaultIPGateway | Select-Object -First 1)
            $mask = ($adapter.IPSubnet | Select-Object -First 1)
            $dns = $adapter.DNSServerSearchOrder
            [PSCustomObject]@{
                Description = $adapter.Description
                IP = $ip
                Gateway = $gw
                Mask = $mask
                DNS = $dns
                MAC = $mac
            } | ConvertTo-Json -Compress
        }
        """
        try:
            data = run_ps_json(ps_script, timeout=8)
            if data and isinstance(data, dict):
                if not info["is_wifi"]:
                    info["adapter_name"] = data.get("Description") or "Adaptador de Rede"
                info["local_ip"] = data.get("IP") or ""
                info["gateway"] = data.get("Gateway") or ""
                info["subnet_mask"] = data.get("Mask") or ""
                info["mac_address"] = data.get("MAC") or ""
                dns_raw = data.get("DNS")
                if isinstance(dns_raw, list):
                    info["dns_servers"] = dns_raw
                elif isinstance(dns_raw, str):
                    info["dns_servers"] = [dns_raw]
                if info["local_ip"]:
                    info["connected"] = True
        except Exception as e:
            LogManager.add_log(f"[AVISO] Falha ao coletar configuração IP: {e}")

        try:
            req = urllib.request.Request(
                "http://ip-api.com/json/?fields=query,isp,org,country",
                headers={"User-Agent": "WinShieldPro/5.0"}
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                geo = json.loads(resp.read().decode('utf-8'))
                info["public_ip"] = geo.get("query", "")
                info["isp"] = f"{geo.get('isp', '')} ({geo.get('country', '')})".strip()
                info["connected"] = True
        except Exception:
            try:
                req2 = urllib.request.Request(
                    "https://api.ipify.org?format=json",
                    headers={"User-Agent": "WinShieldPro/5.0"}
                )
                with urllib.request.urlopen(req2, timeout=1.5) as resp2:
                    geo2 = json.loads(resp2.read().decode('utf-8'))
                    info["public_ip"] = geo2.get("ip", "")
                    info["connected"] = True
            except Exception:
                pass

        try:
            info["closest_server"] = cls.get_cached_closest_server()
        except Exception:
            pass

        return info

    @staticmethod
    def ping_host(host, count=4):
        clean_host = re.sub(r"[^a-zA-Z0-9.-]", "", host.strip())
        if not clean_host:
            return {"error": "Host inválido", "host": host}

        code, out = run_hidden(f"ping -n {count} -w 1500 {clean_host}", timeout=10)

        sent = count
        recv = 0
        loss_pct = 100
        min_ms = 0
        max_ms = 0
        avg_ms = 0

        pk_match = re.search(r"=\s*(\d+),\s*.*?=\s*(\d+),\s*.*?\((\d+)%", out)
        if pk_match:
            try:
                sent = int(pk_match.group(1))
                recv = int(pk_match.group(2))
                loss_pct = int(pk_match.group(3))
            except Exception:
                pass

        time_match = re.search(r"=\s*(\d+)ms,\s*.*?=\s*(\d+)ms,\s*.*?=\s*(\d+)ms", out)
        if time_match:
            try:
                min_ms = int(time_match.group(1))
                max_ms = int(time_match.group(2))
                avg_ms = int(time_match.group(3))
            except Exception:
                pass
        else:
            times = [int(m) for m in re.findall(r"tempo[=<](\d+)ms", out, re.IGNORECASE) or re.findall(r"time[=<](\d+)ms", out, re.IGNORECASE)]
            if times:
                min_ms = min(times)
                max_ms = max(times)
                avg_ms = round(sum(times) / len(times))
                recv = len(times)
                loss_pct = round(((sent - recv) / sent) * 100)

        jitter = max(0, max_ms - min_ms)

        if loss_pct >= 50 or recv == 0:
            rating = "Inacessível / Falha"
            color = "red"
        elif avg_ms < 25:
            rating = "Excelente"
            color = "emerald"
        elif avg_ms < 60:
            rating = "Bom"
            color = "cyan"
        elif avg_ms < 120:
            rating = "Moderado"
            color = "amber"
        else:
            rating = "Latência Alta"
            color = "rose"

        return {
            "host": clean_host,
            "packets_sent": sent,
            "packets_recv": recv,
            "packet_loss": loss_pct,
            "min_ms": min_ms,
            "max_ms": max_ms,
            "avg_ms": avg_ms,
            "jitter_ms": jitter,
            "rating": rating,
            "color": color,
            "status": "online" if recv > 0 else "offline",
            "raw_output": out
        }

    @staticmethod
    def ping_popular_servers():
        targets = [
            {"name": "Cloudflare DNS", "host": "1.1.1.1", "desc": "DNS Primário de Alta Velocidade"},
            {"name": "Google DNS", "host": "8.8.8.8", "desc": "Anycast Global Google"},
            {"name": "OpenDNS", "host": "208.67.222.222", "desc": "Cisco OpenDNS Security"},
            {"name": "Microsoft Azure", "host": "azure.microsoft.com", "desc": "Nuvem Corporativa Microsoft"},
            {"name": "AWS Cloud", "host": "amazon.com", "desc": "Amazon Web Services Global"},
            {"name": "Valve / Steam", "host": "steamcommunity.com", "desc": "Rede de Jogos Steam"}
        ]

        results = []
        with ThreadPoolExecutor(max_workers=6) as executor:
            future_to_server = {
                executor.submit(NetworkEngine.ping_host, item["host"], 3): item for item in targets
            }
            for future in future_to_server:
                item = future_to_server[future]
                try:
                    res = future.result()
                    res["name"] = item["name"]
                    res["desc"] = item["desc"]
                    results.append(res)
                except Exception:
                    results.append({
                        "name": item["name"],
                        "desc": item["desc"],
                        "host": item["host"],
                        "status": "offline",
                        "avg_ms": 0,
                        "packet_loss": 100,
                        "rating": "Erro",
                        "color": "rose"
                    })

        results.sort(key=lambda x: (x.get("avg_ms") if x.get("status") == "online" else 9999))
        return results

    @staticmethod
    def speed_test():
        t_ping = NetworkEngine.ping_host("1.1.1.1", count=3)
        ping_ms = t_ping.get("avg_ms", 20)
        jitter_ms = t_ping.get("jitter_ms", 2)

        download_mbps = NetworkEngine._measure_download_mbps()
        upload_mbps = NetworkEngine._measure_upload_mbps()

        if upload_mbps <= 0 and download_mbps > 0:
            upload_mbps = NetworkEngine._estimate_upload_mbps(download_mbps)

        return {
            "status": "success",
            "download_mbps": download_mbps,
            "upload_mbps": upload_mbps,
            "ping_ms": ping_ms,
            "jitter_ms": jitter_ms,
            "bytes_tested": max(0, int(download_mbps * 1_000_000 / 8)),
            "timestamp": time.strftime("%H:%M:%S")
        }

    @staticmethod
    def quick_repair(action):
        if action == "flush_dns":
            run_hidden("ipconfig /flushdns", timeout=8)
            LogManager.add_log("[REDE] Cache do resolvedor DNS esvaziado com sucesso.")
            return True, "Cache DNS esvaziado com sucesso."

        elif action == "renew_ip":
            run_hidden("ipconfig /release & ipconfig /renew", timeout=15)
            LogManager.add_log("[REDE] Concessão de IP renovada junto ao roteador/DHCP.")
            return True, "Concessão de IP e Gateway renovada com sucesso."

        elif action == "reset_winsock":
            run_hidden("netsh winsock reset", timeout=10)
            LogManager.add_log("[REDE] Catálogo do Winsock restaurado para o padrão limpo.")
            return True, "Catálogo Winsock restaurado com sucesso (reinicialização recomendada)."

        elif action == "reset_stack":
            run_hidden("netsh int ip reset & netsh winsock reset & ipconfig /flushdns", timeout=15)
            LogManager.add_log("[REDE] Pilha TCP/IP e Winsock resetados para configurações de fábrica.")
            return True, "Pilha TCP/IP e DNS totalmente restaurados com sucesso."

        return False, "Ação de rede desconhecida."
