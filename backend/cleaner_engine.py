import os
import time
import shutil
import ctypes
import threading

from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps

LOCAL = os.environ.get("LOCALAPPDATA", "")
ROAMING = os.environ.get("APPDATA", "")
USER_TEMP = os.environ.get("TEMP", "")
WINDIR = os.environ.get("SystemRoot", r"C:\Windows")


class SHQUERYRBINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_ulong),
        ("i64Size", ctypes.c_int64),
        ("i64NumItems", ctypes.c_int64)
    ]


def _get_recycle_bin_stats():
    """Obtém o tamanho real e contagem de itens da Lixeira do Windows instantaneamente."""
    try:
        info = SHQUERYRBINFO()
        info.cbSize = ctypes.sizeof(SHQUERYRBINFO)
        ret = ctypes.windll.shell32.SHQueryRecycleBinW(None, ctypes.byref(info))
        if ret == 0:
            return max(0, int(info.i64Size)), max(0, int(info.i64NumItems))
    except Exception:
        pass
    return 0, 0


def _browser_dirs():
    dirs = []
    for base in (
        os.path.join(LOCAL, r"Google\Chrome\User Data"),
        os.path.join(LOCAL, r"Microsoft\Edge\User Data"),
        os.path.join(LOCAL, r"BraveSoftware\Brave-Browser\User Data")
    ):
        if os.path.isdir(base):
            try:
                for prof in os.listdir(base):
                    p = os.path.join(base, prof)
                    if prof == "Default" or prof.startswith("Profile"):
                        for sub in ("Cache", "Code Cache", "GPUCache", os.path.join("Service Worker", "CacheStorage")):
                            candidate = os.path.join(p, sub)
                            if os.path.isdir(candidate):
                                dirs.append(candidate)
            except Exception:
                pass
    ff = os.path.join(LOCAL, r"Mozilla\Firefox\Profiles")
    if os.path.isdir(ff):
        try:
            for prof in os.listdir(ff):
                candidate = os.path.join(ff, prof, "cache2")
                if os.path.isdir(candidate):
                    dirs.append(candidate)
        except Exception:
            pass
    return dirs


CATEGORIES = {
    "recycle_bin": ("Lixeira do Windows", None),
    "win_temp":    ("Arquivos Temporários do Sistema e Usuário (%TEMP%)", lambda: [os.path.join(WINDIR, "Temp"), USER_TEMP]),
    "win_update":  ("Cache do Windows Update", lambda: [os.path.join(WINDIR, r"SoftwareDistribution\Download")]),
    "browsers":    ("Cache dos Navegadores Web (Chrome/Edge/Brave/Firefox)", _browser_dirs),
    "crashdumps":  ("Crash Dumps e Relatórios de Erro (WER)", lambda: [
        os.path.join(LOCAL, "CrashDumps"),
        os.path.join(WINDIR, "Minidump"),
        r"C:\ProgramData\Microsoft\Windows\WER\ReportArchive",
        r"C:\ProgramData\Microsoft\Windows\WER\ReportQueue"
    ]),
    "thumbs":      ("Cache de Miniaturas e Ícones do Explorer", lambda: [os.path.join(LOCAL, r"Microsoft\Windows\Explorer")]),
    "logs":        ("Logs de Manutenção do Windows (CBS / DISM)", lambda: [
        os.path.join(WINDIR, r"Logs\CBS"),
        os.path.join(WINDIR, r"Logs\DISM")
    ]),
    "delivery":    ("Cache de Otimização de Entrega (WaaS)", lambda: [
        os.path.join(WINDIR, r"ServiceProfiles\NetworkService\AppData\Local\Microsoft\Windows\DeliveryOptimization\Cache")
    ]),
}


def _fmt(b):
    b = float(max(0, b))
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if b < 1024 or unit == "TB":
            return f"{b:.1f} {unit}" if unit != "B" else f"{int(b)} B"
        b /= 1024.0


def _dir_size(path, only_thumbs=False, progress_cb=None):
    total = files = 0
    if not path or not os.path.exists(path):
        return 0, 0
    stack = [path]
    while stack:
        curr = stack.pop()
        try:
            with os.scandir(curr) as it:
                for entry in it:
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            stack.append(entry.path)
                        elif entry.is_file(follow_symlinks=False):
                            if only_thumbs and not (entry.name.startswith("thumbcache_") or entry.name.startswith("iconcache_")):
                                continue
                            sz = entry.stat(follow_symlinks=False).st_size
                            total += sz
                            files += 1
                            if progress_cb and files % 18 == 0:
                                progress_cb(entry.path, sz, 18)
                    except OSError:
                        pass
        except OSError:
            pass
    return total, files


class CleanerEngine:
    _lock = threading.Lock()
    _op_token = 0
    _state = {
        "running": False,
        "action": "idle",  # 'analyze' | 'clean' | 'idle'
        "mode": "idle",
        "percent": 0,
        "current_category": "Pronto",
        "current_path": "Aguardando comando...",
        "files_processed": 0,
        "bytes_processed": 0,
        "formatted_bytes": "0 B",
        "categories": [],
        "completed": False,
        "result": None
    }

    @classmethod
    def get_status(cls):
        with cls._lock:
            st = dict(cls._state)
            st["mode"] = st.get("mode") or st.get("action", "idle")
            st["categories"] = list(cls._state.get("categories", []))
            return st

    @classmethod
    def _update_state(cls, token=None, **kwargs):
        with cls._lock:
            if token is not None and token != cls._op_token:
                return False
            cls._state.update(kwargs)
            if "action" in kwargs and "mode" not in kwargs:
                cls._state["mode"] = kwargs["action"]
            if "bytes_processed" in kwargs:
                cls._state["formatted_bytes"] = _fmt(cls._state["bytes_processed"])
            return True

    @classmethod
    def start_analyze(cls, options):
        options = options or {}
        with cls._lock:
            cls._op_token += 1
            my_token = cls._op_token
            cls._state = {
                "running": True,
                "action": "analyze",
                "mode": "analyze",
                "percent": 2,
                "current_category": "Iniciando varredura de diretórios...",
                "current_path": "Preparando motor de análise...",
                "files_processed": 0,
                "bytes_processed": 0,
                "formatted_bytes": "0 B",
                "categories": [],
                "completed": False,
                "result": None
            }

        def worker():
            try:
                LogManager.add_log("Analisando espaço real ocupado por arquivos temporários e caches...")
                cats = []
                total_b = 0
                total_f = 0
                active_keys = [k for k in CATEGORIES.keys() if options.get(k, True)]
                total_cats = max(1, len(active_keys))

                for idx, key in enumerate(active_keys):
                    label, getter = CATEGORIES[key]
                    base_pct = int((idx / total_cats) * 92) + 4
                    if not cls._update_state(
                        token=my_token,
                        percent=base_pct,
                        current_category=f"Analisando: {label}",
                        current_path=f"Verificando {label}..."
                    ):
                        return
                    b = f = 0
                    if key == "recycle_bin":
                        cls._update_state(token=my_token, current_path=r"C:\$Recycle.Bin")
                        b, f = _get_recycle_bin_stats()
                        time.sleep(0.18)
                    elif getter:
                        dirs = [d for d in getter() if d and os.path.isdir(d)]
                        if not dirs:
                            time.sleep(0.12)
                        for d in dirs:
                            if not cls._update_state(token=my_token, current_path=d):
                                return

                            def _cb(fpath, _sz, _cnt):
                                cls._update_state(
                                    token=my_token,
                                    current_path=fpath,
                                    files_processed=total_f + f + _cnt,
                                    bytes_processed=total_b + b + _sz
                                )

                            db, df = _dir_size(d, only_thumbs=(key == "thumbs"), progress_cb=_cb)
                            b += db
                            f += df
                            time.sleep(0.10)

                    cat_entry = {"key": key, "label": label, "bytes": b, "files": f, "formatted": _fmt(b)}
                    cats.append(cat_entry)
                    total_b += b
                    total_f += f
                    if not cls._update_state(
                        token=my_token,
                        percent=min(98, int(((idx + 1) / total_cats) * 95)),
                        files_processed=total_f,
                        bytes_processed=total_b,
                        categories=list(cats)
                    ):
                        return
                    time.sleep(0.08)

                res = {"bytes": total_b, "files": total_f, "formatted": _fmt(total_b), "categories": cats}
                LogManager.add_log(f"[ANÁLISE REAL] {_fmt(total_b)} em {total_f} itens verificados.")
                cls._update_state(
                    token=my_token,
                    running=False,
                    completed=True,
                    percent=100,
                    current_category="Análise de Disco Concluída!",
                    current_path=f"{total_f} arquivos temporários encontrados ({_fmt(total_b)})",
                    files_processed=total_f,
                    bytes_processed=total_b,
                    categories=cats,
                    result=res
                )
            except Exception as e:
                LogManager.add_log(f"[ERRO ANÁLISE LIMPEZA] {e}")
                cls._update_state(token=my_token, running=False, completed=True, percent=100, current_category="Análise finalizada")

        threading.Thread(target=worker, daemon=True).start()
        return True, "Análise de arquivos iniciada."

    @classmethod
    def start_clean(cls, options):
        options = options or {}
        with cls._lock:
            cls._op_token += 1
            my_token = cls._op_token
            cls._state = {
                "running": True,
                "action": "clean",
                "mode": "clean",
                "percent": 2,
                "current_category": "Iniciando limpeza profunda...",
                "current_path": "Preparando remoção segura de arquivos...",
                "files_processed": 0,
                "bytes_processed": 0,
                "formatted_bytes": "0 B",
                "categories": [],
                "completed": False,
                "result": None
            }

        def worker():
            try:
                LogManager.add_log("=== LIMPEZA PROFUNDA DO SISTEMA INICIADA ===")
                freed = 0
                removed = 0
                active_keys = [k for k in CATEGORIES.keys() if options.get(k, True)]
                total_cats = max(1, len(active_keys))

                if options.get("win_update", True):
                    if not cls._update_state(
                        token=my_token,
                        percent=5,
                        current_category="Pausando Serviço Windows Update...",
                        current_path="net stop wuauserv"
                    ):
                        return
                    run_hidden("net stop wuauserv /y", timeout=20)

                for idx, key in enumerate(active_keys):
                    label, getter = CATEGORIES[key]
                    base_pct = int((idx / total_cats) * 88) + 6
                    if not cls._update_state(
                        token=my_token,
                        percent=base_pct,
                        current_category=f"Apagando: {label}",
                        current_path=f"Limpando {label}..."
                    ):
                        return

                    if key == "recycle_bin":
                        rb_b, rb_f = _get_recycle_bin_stats()
                        cls._update_state(token=my_token, current_path=r"C:\$Recycle.Bin (Esvaziando Lixeira...)")
                        LogManager.add_log(f"Esvaziando Lixeira do Windows ({_fmt(rb_b)} / {rb_f} itens)...")
                        run_ps("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")
                        new_b, new_f = _get_recycle_bin_stats()
                        freed_rb = max(0, rb_b - new_b)
                        removed_rb = max(0, rb_f - new_f)
                        freed += freed_rb if freed_rb > 0 else rb_b
                        removed += removed_rb if removed_rb > 0 else rb_f
                        cls._update_state(token=my_token, files_processed=removed, bytes_processed=freed)
                        time.sleep(0.22)
                        continue

                    if not getter:
                        continue

                    LogManager.add_log(f"Limpando: {label}...")
                    dirs = [d for d in getter() if d and os.path.isdir(d)]
                    if not dirs:
                        time.sleep(0.12)

                    for d in dirs:
                        if not cls._update_state(token=my_token, current_path=d):
                            return
                        try:
                            items = os.listdir(d)
                            total_items = max(1, len(items))
                            for i_idx, item in enumerate(items):
                                p = os.path.join(d, item)
                                try:
                                    if key == "thumbs" and not (item.startswith("thumbcache_") or item.startswith("iconcache_")):
                                        continue
                                    if os.path.isfile(p) or os.path.islink(p):
                                        sz = os.path.getsize(p)
                                        os.unlink(p)
                                        freed += sz
                                        removed += 1
                                    elif os.path.isdir(p):
                                        sz, cnt = _dir_size(p)
                                        shutil.rmtree(p, ignore_errors=True)
                                        if not os.path.exists(p):
                                            freed += sz
                                            removed += max(1, cnt)
                                    if i_idx % 4 == 0 or i_idx == total_items - 1:
                                        sub_pct = base_pct + int(((i_idx + 1) / total_items) * (88 / total_cats))
                                        if not cls._update_state(
                                            token=my_token,
                                            percent=min(95, sub_pct),
                                            current_path=p,
                                            files_processed=removed,
                                            bytes_processed=freed
                                        ):
                                            return
                                        time.sleep(0.015)
                                except OSError:
                                    pass
                        except Exception:
                            pass
                    time.sleep(0.12)

                if options.get("win_update", True):
                    cls._update_state(token=my_token, percent=96, current_category="Restaurando Windows Update...", current_path="net start wuauserv")
                    run_hidden("net start wuauserv", timeout=20)

                if options.get("dns", True):
                    cls._update_state(token=my_token, percent=98, current_category="Limpando Cache DNS...", current_path="ipconfig /flushdns")
                    LogManager.add_log("Limpando cache do resolvedor DNS...")
                    run_hidden("ipconfig /flushdns")
                    time.sleep(0.15)

                res = {"freed_bytes": freed, "formatted": _fmt(freed), "files": removed}
                LogManager.add_log(f"=== LIMPEZA CONCLUÍDA: {removed} arquivos deletados | {_fmt(freed)} liberados no disco ===")
                cls._update_state(
                    token=my_token,
                    running=False,
                    completed=True,
                    percent=100,
                    current_category="Limpeza Concluída com Sucesso!",
                    current_path=f"{removed} arquivos apagados ({_fmt(freed)} liberados)",
                    files_processed=removed,
                    bytes_processed=freed,
                    result=res
                )
            except Exception as e:
                LogManager.add_log(f"[ERRO LIMPEZA] {e}")
                cls._update_state(token=my_token, running=False, completed=True, percent=100, current_category="Limpeza finalizada")

        threading.Thread(target=worker, daemon=True).start()
        return True, "Limpeza iniciada."

    @staticmethod
    def analyze(options):
        LogManager.add_log("Analisando espaço real ocupado por arquivos temporários e caches...")
        cats, total_b, total_f = [], 0, 0
        for key, (label, getter) in CATEGORIES.items():
            if not options.get(key, True):
                continue
            b = f = 0
            if key == "recycle_bin":
                b, f = _get_recycle_bin_stats()
            elif getter:
                for d in getter():
                    if d and os.path.isdir(d):
                        db, df = _dir_size(d, only_thumbs=(key == "thumbs"))
                        b += db
                        f += df
            cats.append({"key": key, "label": label, "bytes": b, "files": f, "formatted": _fmt(b)})
            total_b += b
            total_f += f
        LogManager.add_log(f"[ANÁLISE REAL] {_fmt(total_b)} em {total_f} itens verificados.")
        return {"bytes": total_b, "files": total_f, "formatted": _fmt(total_b), "categories": cats}

    @staticmethod
    def execute(options):
        options = options or {}
        LogManager.add_log("=== LIMPEZA PROFUNDA DO SISTEMA INICIADA ===")
        freed = removed = 0
        if options.get("win_update", True):
            run_hidden("net stop wuauserv /y", timeout=30)
        if options.get("recycle_bin", True):
            rb_b, rb_f = _get_recycle_bin_stats()
            LogManager.add_log(f"Esvaziando Lixeira do Windows ({_fmt(rb_b)} / {rb_f} itens)...")
            run_ps("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")
            new_b, new_f = _get_recycle_bin_stats()
            freed_rb = max(0, rb_b - new_b)
            removed_rb = max(0, rb_f - new_f)
            freed += freed_rb if freed_rb > 0 else rb_b
            removed += removed_rb if removed_rb > 0 else rb_f

        for key, (label, getter) in CATEGORIES.items():
            if key == "recycle_bin" or not options.get(key, True) or not getter:
                continue
            LogManager.add_log(f"Limpando: {label}...")
            for d in getter():
                if not d or not os.path.isdir(d):
                    continue
                try:
                    for item in os.listdir(d):
                        p = os.path.join(d, item)
                        try:
                            if key == "thumbs" and not (item.startswith("thumbcache_") or item.startswith("iconcache_")):
                                continue
                            if os.path.isfile(p) or os.path.islink(p):
                                sz = os.path.getsize(p)
                                os.unlink(p)
                                freed += sz
                                removed += 1
                            elif os.path.isdir(p):
                                sz, cnt = _dir_size(p)
                                shutil.rmtree(p, ignore_errors=True)
                                if not os.path.exists(p):
                                    freed += sz
                                    removed += cnt
                        except OSError:
                            pass
                except Exception:
                    pass

        if options.get("win_update"):
            run_hidden("net start wuauserv", timeout=30)
        if options.get("dns"):
            LogManager.add_log("Limpando cache do resolvedor DNS...")
            run_hidden("ipconfig /flushdns")

        LogManager.add_log(f"=== LIMPEZA CONCLUÍDA: {removed} arquivos deletados | {_fmt(freed)} liberados no disco ===")
        return {"freed_bytes": freed, "formatted": _fmt(freed), "files": removed}
