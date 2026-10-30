"""
WinShield Pro v5.0 Enterprise - Motor de Telemetria de Memória & RAMGuard™ Memory Integrity Matrix.
Extrai informações físicas de pentes de RAM (DDR4/DDR5, slots, frequências, números de série)
e executa testes de estresse e integridade de memória com algoritmos avançados (Bit-Flip, March C-, Walking Bits).
"""
import os
import sys
import time
import ctypes
import threading
from datetime import datetime

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_ps_json, run_hidden

try:
    from ctypes import wintypes
except ImportError:
    wintypes = None


class _MEMORYSTATUS(ctypes.Structure if ctypes else object):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("ullAvailExtendedVirtual", ctypes.c_ulonglong)
    ] if ctypes else []


class MemoryEngine:
    """Telemetria profunda de memória RAM e testes de integridade."""

    _test_thread = None
    _test_cancel = threading.Event()
    _test_status = {
        "state": "idle",       # idle, running, completed, cancelled, failed
        "progress_percent": 0,
        "current_pass": 1,
        "total_passes": 1,
        "current_pattern": "Nenhum",
        "tested_mb": 0,
        "total_mb": 0,
        "speed_mb_s": 0.0,
        "errors_found": 0,
        "error_log": [],
        "elapsed_seconds": 0,
        "start_time": None
    }
    _status_lock = threading.Lock()

    @classmethod
    def get_memory_info(cls):
        """Retorna informações completas de uso em tempo real e especificação de hardware dos pentes de RAM."""
        # 1. Coleta estatísticas de uso via Kernel Win32
        load_pct = 0
        total_phys_b = 0
        avail_phys_b = 0
        used_phys_b = 0
        pagefile_total_b = 0
        pagefile_avail_b = 0

        if IS_WINDOWS and ctypes:
            try:
                stat = _MEMORYSTATUS()
                stat.dwLength = ctypes.sizeof(_MEMORYSTATUS)
                ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
                load_pct = stat.dwMemoryLoad
                total_phys_b = stat.ullTotalPhys
                avail_phys_b = stat.ullAvailPhys
                used_phys_b = total_phys_b - avail_phys_b
                pagefile_total_b = stat.ullTotalPageFile
                pagefile_avail_b = stat.ullAvailPageFile
            except Exception:
                pass

        # 2. Coleta módulos físicos via WMI Win32_PhysicalMemory (somente dados reportados pelo SPD/SMBIOS)
        modules = []
        try:
            cmd = (
                "Get-CimInstance Win32_PhysicalMemory | "
                "Select-Object DeviceLocator, BankLabel, Manufacturer, PartNumber, Capacity, Speed, "
                "ConfiguredClockSpeed, ConfiguredVoltage, MinVoltage, MaxVoltage, SerialNumber, SMBIOSMemoryType, "
                "FormFactor, DataWidth, TotalWidth | ConvertTo-Json -Compress"
            )
            raw = run_ps_json(cmd, timeout=12)
            if isinstance(raw, dict):
                raw = [raw]
            smbios = {20: "DDR", 21: "DDR2", 24: "DDR3", 26: "DDR4", 27: "LPDDR", 28: "LPDDR2",
                      29: "LPDDR3", 30: "LPDDR4", 34: "DDR5", 35: "LPDDR5"}
            form = {8: "DIMM", 12: "SODIMM", 13: "SRIMM", 0: "—"}
            for idx, m in enumerate(raw if isinstance(raw, list) else []):
                cap_b = int(m.get("Capacity") or 0)
                rated = int(m.get("Speed") or 0)
                configured = int(m.get("ConfiguredClockSpeed") or 0)
                volt = m.get("ConfiguredVoltage") or m.get("MinVoltage")
                part = (m.get("PartNumber") or "").strip()
                mtype = smbios.get(int(m.get("SMBIOSMemoryType") or 0))
                if not mtype:
                    pu = part.upper()
                    mtype = "DDR5" if "DDR5" in pu else ("DDR4" if "DDR4" in pu else "—")
                ecc = (m.get("TotalWidth") or 0) > (m.get("DataWidth") or 0) > 0
                modules.append({
                    "slot": (m.get("DeviceLocator") or m.get("BankLabel") or f"Slot {idx + 1}").strip(),
                    "bank": (m.get("BankLabel") or "").strip(),
                    "manufacturer": (m.get("Manufacturer") or "").strip() or "Não informado",
                    "part_number": part or "Não informado",
                    "serial_number": (m.get("SerialNumber") or "").strip() or "—",
                    "capacity_gb": round(cap_b / (1024 ** 3), 1),
                    "capacity_bytes": cap_b,
                    "speed_mhz": configured or rated or None,
                    "rated_speed_mhz": rated or None,
                    "configured_speed_mhz": configured or None,
                    "type": mtype,
                    "form_factor": form.get(int(m.get("FormFactor") or 0), "—"),
                    "ecc": bool(ecc),
                    "voltage": f"{round(volt / 1000, 2)} V" if volt else "N/D",
                })
        except Exception as e:
            LogManager.add_log(f"[AVISO] Falha ao coletar dados dos módulos de memória: {e}")

        return {
            "load_percent": load_pct,
            "total_bytes": total_phys_b,
            "used_bytes": used_phys_b,
            "avail_bytes": avail_phys_b,
            "total_gb": round(total_phys_b / (1024**3), 2),
            "used_gb": round(used_phys_b / (1024**3), 2),
            "avail_gb": round(avail_phys_b / (1024**3), 2),
            "pagefile_total_gb": round(pagefile_total_b / (1024**3), 2),
            "pagefile_used_gb": round((pagefile_total_b - pagefile_avail_b) / (1024**3), 2),
            "modules": modules,
            "module_count": len(modules)
        }

    # Algoritmos do RAMGuard (algoritmos clássicos de diagnóstico de RAM)
    ALGORITHMS = {
        "quick": ["solid", "checker", "address", "moving_inv", "walking8", "random"],
        "standard": ["solid", "checker", "address", "moving_inv", "walking64", "random", "random2"],
        "deep": ["solid", "checker", "address", "moving_inv", "walking64", "random", "random2", "retention"],
    }
    DEFAULT_PASSES = {"quick": 1, "standard": 2, "deep": 4}
    RETENTION_WAIT_SEC = 60
    ALGO_NAMES = {
        "solid": "Bits sólidos (0x00 / 0xFF)",
        "checker": "Tabuleiro de xadrez (0x55 / 0xAA)",
        "address": "Endereço próprio (address-in-address)",
        "moving_inv": "Inversões móveis (ascendente/descendente)",
        "walking8": "Walking ones (8 posições)",
        "walking64": "Walking ones (64 posições)",
        "random": "Dados aleatórios com semente",
        "random2": "Dados aleatórios (2ª semente)",
        "retention": "Retenção de carga (bit fade, 2 × 60 s)",
    }

    @classmethod
    def start_memory_test(cls, size_mb=0, passes=None, mode="quick"):
        """Inicia o teste de integridade de RAM (verificação de 100% das palavras de 64 bits)."""
        try:
            import numpy  # noqa: F401
        except ImportError:
            return False, "NumPy não está instalado: o teste de memória não pode ser executado."
        with cls._status_lock:
            if cls._test_status["state"] == "running":
                return False, "Já existe um teste de memória em andamento."
            mode = str(mode or "quick").lower()
            if mode in ("full", "profundo", "completo"):
                mode = "deep"
            if mode not in cls.ALGORITHMS:
                mode = "quick"
            try:
                size_mb = int(size_mb or 0)
            except (TypeError, ValueError):
                size_mb = 0
            try:
                passes = int(passes) if passes else cls.DEFAULT_PASSES[mode]
            except (TypeError, ValueError):
                passes = cls.DEFAULT_PASSES[mode]
            passes = max(1, min(passes, 20))
            if size_mb <= 0:
                # Automático: 50% da memória livre (rápido/padrão) ou 75% (profundo)
                frac = 0.75 if mode == "deep" else 0.5
                size_mb = max(512, int(cls._available_mb() * frac))

            # Limite seguro: nunca forçar paginação (que mediria o disco, não a RAM)
            avail_mb = cls._available_mb()
            limit = max(256, int(avail_mb * 0.80) - 512) if avail_mb else size_mb
            capped = min(size_mb, limit)
            capped = max(128, (capped // 64) * 64)

            cls._test_cancel.clear()
            algos = cls.ALGORITHMS[mode]
            cls._test_status = {
                "state": "running",
                "mode": mode,
                "progress_percent": 0,
                "current_pass": 1,
                "total_passes": passes,
                "current_pattern": "Alocando e comprometendo memória física...",
                "current_algorithm": None,
                "algorithms": [cls.ALGO_NAMES[a] for a in algos],
                "tested_mb": 0,
                "total_mb": capped,
                "requested_mb": size_mb,
                "capped_by_free_memory": capped < size_mb,
                "speed_mb_s": 0.0,
                "bytes_verified_gb": 0.0,
                "errors_found": 0,
                "error_log": [],
                "results": [],
                "elapsed_seconds": 0,
                "eta_seconds": None,
                "start_time": time.time(),
            }
            cls._test_thread = threading.Thread(target=cls._run_test_worker, args=(capped, passes, algos), daemon=True)
            cls._test_thread.start()

        LogManager.add_log(f"=== RAMGUARD: teste de {capped} MB, {passes} passe(s), {len(algos)} algoritmos ===")
        if capped < size_mb:
            LogManager.add_log(f"[RAMGUARD] Tamanho reduzido de {size_mb} MB para {capped} MB (memória livre insuficiente).")
        return True, f"Teste de integridade iniciado ({capped} MB, {passes} passe(s))."

    @staticmethod
    def _available_mb():
        try:
            import psutil
            return int(psutil.virtual_memory().available / (1024 * 1024))
        except Exception:
            return 0

    @classmethod
    def _run_test_worker(cls, size_mb, passes, algos):
        import numpy as np
        CHUNK = 64 * 1024 * 1024
        words = CHUNK // 8
        blocks = []
        t0 = time.time()
        ALL = np.uint64(0xFFFFFFFFFFFFFFFF)

        def set_status(**kw):
            with cls._status_lock:
                cls._test_status.update(kw)

        try:
            for i in range(max(1, size_mb // 64)):
                if cls._test_cancel.is_set():
                    break
                try:
                    b = np.empty(words, dtype=np.uint64)
                    b.fill(0)      # compromete as páginas físicas (não apenas reserva)
                    blocks.append(b)
                except MemoryError:
                    LogManager.add_log(f"[RAMGUARD] Alocação parou em {len(blocks) * 64} MB (MemoryError).")
                    break
                set_status(current_pattern=f"Alocando memória física... {len(blocks) * 64} MB")
            if not blocks:
                set_status(state="failed", current_pattern="Não foi possível alocar memória para o teste")
                return
            alloc_mb = len(blocks) * 64
            set_status(total_mb=alloc_mb)

            # Peso de cada algoritmo em operações completas de varredura (escrita+leitura)
            weight = {"solid": 4, "checker": 4, "address": 4, "moving_inv": 6, "walking8": 16,
                      "walking64": 128, "random": 2, "random2": 2, "retention": 4}
            total_units = passes * sum(weight[a] for a in algos) * len(blocks)
            done_units = 0
            bytes_processed = 0
            addr = np.arange(words, dtype=np.uint64)
            tmp = np.empty(words, dtype=np.uint64)

            def report_error(algo, bi, bad_mask_count, expected_desc):
                with cls._status_lock:
                    cls._test_status["errors_found"] += bad_mask_count
                    if len(cls._test_status["error_log"]) < 200:
                        cls._test_status["error_log"].append(
                            f"{cls.ALGO_NAMES[algo]}: {bad_mask_count} palavra(s) incorreta(s) no bloco {bi} "
                            f"(faixa 0x{bi * CHUNK:X}–0x{(bi + 1) * CHUNK - 1:X}, esperado {expected_desc})")
                LogManager.add_log(f"[RAMGUARD ERRO] {cls.ALGO_NAMES[algo]} — bloco {bi}: {bad_mask_count} palavra(s) incorreta(s)")

            def tick(units, nbytes, pass_idx, mb_done):
                nonlocal done_units, bytes_processed
                done_units += units
                bytes_processed += nbytes
                el = max(0.001, time.time() - t0)
                pct = min(99, int(done_units * 100 / max(1, total_units)))
                eta = int(el / max(1e-9, done_units / total_units) - el) if done_units else None
                set_status(progress_percent=pct, speed_mb_s=round(bytes_processed / el / 1048576, 1),
                           bytes_verified_gb=round(bytes_processed / 2 / 1e9, 2), elapsed_seconds=int(el),
                           eta_seconds=eta, tested_mb=mb_done)

            def fill_verify(algo, bi, b, value, pass_idx, mb_done):
                v = np.uint64(value)
                b.fill(v)
                bad = int(np.count_nonzero(b != v))
                if bad:
                    report_error(algo, bi, bad, f"0x{int(value):016X}")
                tick(2, 2 * CHUNK, pass_idx, mb_done)

            for p in range(1, passes + 1):
                if cls._test_cancel.is_set():
                    break
                set_status(current_pass=p)
                for algo in algos:
                    if cls._test_cancel.is_set():
                        break
                    a_t0 = time.time()
                    err_before = cls._test_status["errors_found"]
                    set_status(current_algorithm=cls.ALGO_NAMES[algo],
                               current_pattern=f"{cls.ALGO_NAMES[algo]} — passe {p}/{passes}")
                    nb = len(blocks)
                    for bi, b in enumerate(blocks):
                        if cls._test_cancel.is_set():
                            break
                        mb = (bi + 1) * 64
                        base = np.uint64(bi * words)
                        if algo == "solid":
                            fill_verify(algo, bi, b, 0, p, mb)
                            fill_verify(algo, bi, b, 0xFFFFFFFFFFFFFFFF, p, mb)
                        elif algo == "checker":
                            fill_verify(algo, bi, b, 0x5555555555555555, p, mb)
                            fill_verify(algo, bi, b, 0xAAAAAAAAAAAAAAAA, p, mb)
                        elif algo == "address":
                            for inv in (False, True):
                                np.add(addr, base, out=b)
                                np.add(addr, base, out=tmp)
                                if inv:
                                    np.invert(b, out=b)
                                    np.invert(tmp, out=tmp)
                                bad = int(np.count_nonzero(b != tmp))
                                if bad:
                                    report_error(algo, bi, bad, "endereço" + (" invertido" if inv else ""))
                                tick(2, 2 * CHUNK, p, mb)
                        elif algo.startswith("walking"):
                            nbits = 8 if algo == "walking8" else 64
                            step = 64 // nbits
                            for k in range(nbits):
                                fill_verify(algo, bi, b, 1 << (k * step), p, mb)
                        elif algo.startswith("random"):
                            seed = (p * 7919 + bi) * (2 if algo == "random2" else 1)
                            b[:] = np.random.default_rng(seed).integers(0, ALL, size=words, dtype=np.uint64, endpoint=True)
                            tmp[:] = np.random.default_rng(seed).integers(0, ALL, size=words, dtype=np.uint64, endpoint=True)
                            bad = int(np.count_nonzero(b != tmp))
                            if bad:
                                report_error(algo, bi, bad, "sequência pseudoaleatória")
                            tick(2, 2 * CHUNK, p, mb)
                    if algo == "retention" and not cls._test_cancel.is_set():
                        # Bit fade: grava o padrão, deixa a RAM em repouso e verifica se as
                        # células retiveram a carga (detecta falhas de refresh/retenção).
                        for pat in (np.uint64(0), ALL):
                            if cls._test_cancel.is_set():
                                break
                            for b in blocks:
                                b.fill(pat)
                            for remaining in range(cls.RETENTION_WAIT_SEC, 0, -1):
                                if cls._test_cancel.wait(1.0):
                                    break
                                set_status(current_pattern=f"{cls.ALGO_NAMES[algo]} — aguardando retenção "
                                                           f"({remaining - 1} s) — passe {p}/{passes}")
                            for bi, b in enumerate(blocks):
                                bad = int(np.count_nonzero(b != pat))
                                if bad:
                                    report_error(algo, bi, bad, f"0x{int(pat):016X} após repouso")
                                tick(2, 2 * CHUNK, p, (bi + 1) * 64)
                    if algo == "moving_inv" and not cls._test_cancel.is_set():
                        # Inversões móveis: percorre todos os blocos em ordem crescente e depois
                        # decrescente, verificando o padrão anterior antes de gravar o inverso.
                        pat = np.uint64(0x5555555555555555)
                        inv = ~pat
                        for bi, b in enumerate(blocks):
                            b.fill(pat)
                        for order, (exp, new) in ((range(nb), (pat, inv)), (range(nb - 1, -1, -1), (inv, pat))):
                            for bi in order:
                                if cls._test_cancel.is_set():
                                    break
                                b = blocks[bi]
                                bad = int(np.count_nonzero(b != exp))
                                if bad:
                                    report_error(algo, bi, bad, f"0x{int(exp):016X}")
                                b.fill(new)
                                tick(3, 3 * CHUNK, p, (bi + 1) * 64)
                    errs = cls._test_status["errors_found"] - err_before
                    with cls._status_lock:
                        cls._test_status["results"].append({
                            "pass": p, "algorithm": cls.ALGO_NAMES[algo], "errors": errs,
                            "seconds": round(time.time() - a_t0, 1),
                            "status": "FALHA" if errs else "OK"})

            el = time.time() - t0
            with cls._status_lock:
                st = cls._test_status
                st["elapsed_seconds"] = int(el)
                st["eta_seconds"] = 0
                if cls._test_cancel.is_set():
                    st["state"] = "cancelled"
                    st["current_pattern"] = "Teste cancelado pelo usuário"
                else:
                    st["state"] = "completed"
                    st["progress_percent"] = 100
                    st["tested_mb"] = alloc_mb
                    if st["errors_found"] == 0:
                        st["current_pattern"] = (f"Concluído: 0 erros em {alloc_mb} MB × {passes} passe(s) "
                                                 f"({st['bytes_verified_gb']} GB verificados em {int(el)} s)")
                    else:
                        st["current_pattern"] = f"FALHA: {st['errors_found']} palavra(s) de memória com erro"
            LogManager.add_log(f"[RAMGUARD] {cls._test_status['current_pattern']}")
        except Exception as ex:
            set_status(state="failed", current_pattern=f"Erro no teste: {ex}")
            LogManager.add_log(f"[ERRO RAMGUARD] {ex}")
        finally:
            blocks.clear()
            import gc
            gc.collect()

    @classmethod
    def get_test_status(cls):
        """Retorna o estado ao vivo do teste de memória."""
        with cls._status_lock:
            return dict(cls._test_status)

    @classmethod
    def cancel_test(cls):
        """Cancela o teste de memória imediatamente."""
        with cls._status_lock:
            if cls._test_status["state"] == "running":
                cls._test_cancel.set()
                return True, "Cancelamento do teste de memória solicitado."
        return False, "Nenhum teste de memória ativo."

    @classmethod
    def stop_memory_test(cls):
        """Alias para cancel_test usado pela rota /api/memory/test/stop."""
        return cls.cancel_test()
