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
│   ├── stability.html                 # 16. Teste de estabilidade e StressBench
│   └── maintenance.html               # 17. Manutenção (SFC, DISM, CHKDSK, TRIM)
│
├── css/                               # Estilos e temas organizados
│   └── main.css                       # Estilos globais, temas (Dark/Light), scrollbars e animações
│
├── js/
│   └── core/
│       └── app.js                     # Lógica da interface, traduções (pt-BR, en-US, es-ES) e polling
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
