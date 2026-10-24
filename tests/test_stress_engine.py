# -*- coding: utf-8 -*-
import time
from backend.stress_engine import StressEngine


def test_stress_engine_parameter_changes_and_stop():
    # 1. Start with CPU only, 2 threads, no RAM
    ok, msg = StressEngine.start_test({
        "stress_cpu": True,
        "stress_fpu": False,
        "stress_cache": False,
        "stress_memory": False,
        "stress_disk": False,
        "stress_gpu": False,
        "threads": 2,
    })
    assert ok is True
    time.sleep(0.5)
    st = StressEngine.get_status()
    assert st["running"] is True
    assert st["memory_tested_mb"] == 0

    # 2. Stop test immediately
    t0 = time.time()
    ok_stop, msg_stop = StressEngine.stop_test()
    assert ok_stop is True
    assert (time.time() - t0) < 0.5
    time.sleep(0.2)
    st = StressEngine.get_status()
    assert st["running"] is False

    # 3. Change parameters: RAM only (256 MB), no CPU
    ok2, msg2 = StressEngine.start_test({
        "stress_cpu": False,
        "stress_fpu": False,
        "stress_cache": False,
        "stress_memory": True,
        "stress_disk": False,
        "stress_gpu": False,
        "threads": 0,
        "memory_mb": 256,
    })
    assert ok2 is True
    time.sleep(0.5)
    st2 = StressEngine.get_status()
    assert st2["running"] is True
    assert st2["memory_tested_mb"] >= 250

    # 4. Stop test again
    ok_stop2, _ = StressEngine.stop_test()
    assert ok_stop2 is True
    time.sleep(0.2)
    st2 = StressEngine.get_status()
    assert st2["running"] is False
    assert st2["memory_tested_mb"] == 0
