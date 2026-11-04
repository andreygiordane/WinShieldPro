from backend.aptitude_engine import evaluate


def _res(ram=16, threads=8, rnd=50.0, mem_errors=0, stab=99.5, stab_errors=0, drop=1.0,
         os_name="Windows 11 Pro", tpm=True, health=95):
    return {
        "facts": {"cpu": "CPU", "cores": threads // 2, "threads": threads, "ram_gb": ram, "os": os_name,
                  "os_business": "Home" not in os_name, "tpm2": tpm, "secure_boot": tpm,
                  "system_disk": {"model": "SSD", "media": "SSD", "health": health}},
        "memory": {"errors": mem_errors, "tested_mb": 512},
        "disk": {"drive": "C:", "rnd_read_q1": rnd},
        "stability": {"complete": True, "errors": stab_errors, "stability": stab, "clock_drop_pct": drop},
    }


def _verdicts(res):
    return {p["key"]: p["level"] for p in evaluate(res)}


def test_healthy_machine_passes_everything():
    assert _verdicts(_res()) == {"home": "ok", "business": "ok", "office": "ok"}


def test_memory_errors_fail_every_profile():
    assert set(_verdicts(_res(mem_errors=3)).values()) == {"fail"}


def test_small_variation_without_errors_is_only_a_warning():
    assert set(_verdicts(_res(stab=96.8, drop=0.8)).values()) == {"warn"}


def test_calculation_errors_under_load_fail():
    assert set(_verdicts(_res(stab_errors=1)).values()) == {"fail"}


def test_hard_drive_is_warning_at_home_but_fails_business():
    v = _verdicts(_res(rnd=1.2))
    assert v["home"] == "warn" and v["business"] == "fail" and v["office"] == "fail"


def test_windows_home_fails_only_corporate():
    v = _verdicts(_res(os_name="Windows 11 Home"))
    assert v["home"] == "ok" and v["business"] == "ok" and v["office"] == "fail"


def test_low_ram_thresholds():
    v = _verdicts(_res(ram=4, threads=4))
    assert v["home"] == "warn" and v["business"] == "fail"


def test_acpi_zone_used_only_when_it_behaves_like_a_sensor():
    from backend.telemetry import _AcpiCpuTemp as A
    A._range.clear()
    assert [A.update({"TZ": 16.9}) for _ in range(3)] == [None, None, None]   # fixo e implausível
    A._range.clear()
    assert [A.update({"TZ": 27.8}) for _ in range(3)] == [None, None, None]   # fixo (comum em desktops)
    A._range.clear()
    assert [A.update({"CPU": v}) for v in (45.0, 46.0, 52.5)] == [None, None, 52.5]  # acompanha a carga
