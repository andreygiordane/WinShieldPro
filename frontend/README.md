# 🎨 Frontend Modular - WinShield Pro Enterprise

A interface do WinShield Pro é estruturada de forma modular para máxima organização, facilidade de manutenção e alto desempenho.

---

## 📁 Estrutura de Pastas

```text
frontend/
├── pages/                             # Visualizações individuais (HTML) de cada tela/aba
│   ├── overview.html                  # 1. Central do Sistema / Dashboard Geral
│   ├── silicon.html                      # 2. Informações de CPU & Placa-Mãe (Silicon Core™)
│   ├── vision.html                      # 3. Informações da Placa de Vídeo (Vision Engine™)
│   ├── memory.html                    # 4. Memória RAM e Otimização de Working Set
│   ├── disk_health.html               # 5. Saúde dos Discos (S.M.A.R.T. SATA/NVMe)
│   ├── disk_bench.html                # 6. Teste de Velocidade de Disco (Direct I/O)
│   ├── running_apps.html              # 7. Gerenciador de Processos e Aplicativos
│   ├── audit.html                     # 8. Auditoria de Registro & Desinstalação
│   ├── antivirus.html                 # 9. Antivírus & Caçador de Ameaças
│   ├── clean.html                     # 10. Limpeza Profunda de Arquivos Temporários
│   ├── power.html                     # 11. Gerenciador de Planos de Energia
│   ├── optimize.html                  # 12. Otimização do Sistema e Debloat
│   ├── terminal.html                  # 13. Console e Terminal em Tempo Real
│   ├── network.html                   # 14. Rede, Wi-Fi, Ping e Teste de Velocidade
│   ├── devices.html                   # 15. Gerenciador de Dispositivos e Drivers
│   └── stability.html                 # 16. Teste de Estabilidade do Sistema (StressPulse™)
│
├── css/                               # Estilos e temas organizados
│   └── main.css                       # Estilos globais, temas (Dark/Light), scrollbars e animações
│
├── js/                                # Scripts JavaScript modulares
│   ├── core/                          # Núcleo da interface
│   │   ├── splash.js                  # Controle da Splash Screen de inicialização
│   │   ├── theme.js                   # Alternância de Temas Claro/Escuro
│   │   ├── window.js                  # Controles da janela desktop (minimizar, fechar)
│   │   ├── toast.js                   # Sistema de notificações animadas
│   │   ├── router.js                  # Roteamento e navegação entre abas
│   │   ├── sidebar.js                 # Gestão da sidebar responsiva e busca rápida
│   │   ├── logs.js                    # Streaming de logs do console
│   │   └── app.js                     # Script mestre integrado
│   │
│   ├── i18n/                          # Internacionalização (Multi-idioma)
│   │   └── translations.js            # Dicionários completos: pt-BR, en-US e es-ES
│   │
│   └── controllers/                   # Controladores especializados por funcionalidade
│       ├── dashboard.controller.js    # Controlador da Central Geral
│       ├── disks.controller.js        # S.M.A.R.T., Benchmark e SectorGuard™ Surface Scan
│       ├── security.controller.js     # Antivírus, Threat Hunter e Auditoria
│       ├── cleaner.controller.js      # Limpeza profunda com progresso
│       ├── optimizer.controller.js    # Otimizações de sistema e debloat
│       ├── terminal.controller.js     # Execução invisível de comandos CMD/PS
│       ├── network.controller.js      # Testes de rede e reparos
│       ├── devices.controller.js      # Gerenciamento de drivers
│       ├── stress.controller.js       # Teste de estabilidade e gráficos
│       └── apps.controller.js         # Processos em execução
│
└── winshield_pro_dashboard.html       # Pacote integrado autônomo (Standalone SPA)
```

---

## ⚡ Como Compilar Alterações do Frontend

Ao realizar alterações em qualquer página individual dentro de `pages/`, estilo em `css/` ou script em `js/`, basta executar:

```bash
python scripts/build_frontend.py
```

Isso atualizará instantaneamente o arquivo compilado `winshield_pro_dashboard.html`, garantindo carregamento ultrarrápido na inicialização do aplicativo desktop sem roundtrips adicionais de requisição HTTP.
