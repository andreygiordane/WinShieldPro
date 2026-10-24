# 🏛️ Backend - Clean Architecture & Arquitetura Hexagonal (Ports & Adapters)

O backend do WinShield Pro foi estruturado seguindo os princípios de **Clean Architecture** e **Arquitetura Hexagonal (Portas e Adaptadores)** de Robert C. Martin (Uncle Bob) e Alistair Cockburn, garantindo separação estrita de responsabilidades, testabilidade e total desacoplamento.

---

## 📐 Camadas da Arquitetura

```text
backend/
│
├── domain/                            # Camada 1: DOMÍNIO (Regras e Contratos Puros)
│   ├── entities/                      # Entidades puras sem dependências externas
│   │   ├── system.py                  # CPUInfo, MemoryMetrics, LiveTelemetry
│   │   ├── storage.py                 # SmartAttribute, DiskHealthInfo, BenchmarkResult
│   │   ├── security.py                # ThreatItem, DefenderStatus
│   │   └── maintenance.py             # JunkCategory, OptimizationTaskResult
│   └── ports/                         # Portas / Interfaces formais (Protocols)
│       ├── system_port.py             # ISystemPort, IHardwareMonitorPort
│       ├── storage_port.py            # IDiskHealthPort, IDiskBenchmarkPort
│       ├── security_port.py           # ISecurityPort, IAuditPort
│       ├── maintenance_port.py        # ICleanerPort, IOptimizerPort
│       └── logging_port.py            # ILogPort
│
├── application/                       # Camada 2: APLICAÇÃO (Casos de Uso)
│   ├── use_cases/                     # Orquestração específica de cada regra de aplicação
│   │   ├── system_use_cases.py        # Obter telemetria, visão geral, sensores CPU/GPU
│   │   ├── storage_use_cases.py       # Diagnóstico SMART, Benchmark físico, Varredura
│   │   ├── security_use_cases.py      # Caça de ameaças, varredura Defender, auditoria
│   │   └── maintenance_use_cases.py   # Análise de temporários, limpeza, otimização
│   └── services/                      # Serviços de coordenação de múltiplos casos de uso
│
├── infrastructure/                    # Camada 3: INFRAESTRUTURA (Adaptadores Concretos)
│   ├── adapters/                      # Implementação concreta das portas de domínio
│   │   ├── logging_adapter.py         # Implementação de ILogPort via buffer FIFO
│   │   └── process_adapter.py         # Execução de comandos nativos e PowerShell invisível
│   └── bin/                           # Utilitários binários nativos (DiskSpd64.exe)
│
├── api/                               # Camada 4: APRESENTAÇÃO / REST API
│   ├── router.py                      # Roteador central que despacha requisições HTTP
│   └── controllers/                   # Controladores REST desacoplados por contexto
│       ├── system_controller.py       # /api/system/*, /api/status, /api/silicon/*, /api/vision/*
│       ├── disk_controller.py         # /api/disks/*
│       ├── security_controller.py     # /api/antivirus/*, /api/audit/*
│       ├── maintenance_controller.py  # /api/clean/*, /api/optimize/*
│       ├── network_controller.py      # /api/network/*
│       ├── power_controller.py        # /api/power/*
│       ├── apps_controller.py         # /api/apps/*, /api/memory/*
│       ├── stress_controller.py       # /api/stress/*
│       └── logs_controller.py         # /api/logs/*
│
└── [Motores Legados de Suporte]       # Compatibilidade total garantida (antivirus_engine.py, etc.)
```

---

## 🔄 Fluxo de Dependência (Dependency Rule)

As dependências apontam sempre de **fora para dentro**:
```text
[API / Controllers] ───> [Casos de Uso (Application)] ───> [Entidades / Portas (Domain)]
                                      │
[Adaptadores (Infrastructure)] ───────┘
```
- O **Domínio** não conhece o Windows, o HTTP nem nenhuma biblioteca externa.
- A **Aplicação** define os fluxos de negócios através de casos de uso puros.
- A **Infraestrutura** implementa os detalhes de hardware (Win32, IOCTL, CIM/WMI).
- A **API** expõe os casos de uso através de rotas REST JSON para o Frontend.
