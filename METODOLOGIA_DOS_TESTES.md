# WinShield Pro — Metodologia dos testes e da telemetria

Este documento descreve **como cada número exibido pelo WinShield Pro é obtido**.
Regra geral: **nenhum valor é simulado ou estimado**. Quando o Windows não expõe um
sensor, a interface mostra **N/D** em vez de inventar um valor.

## Telemetria (backend/telemetry.py)

| Dado | Fonte |
|---|---|
| Uso de CPU (total e por núcleo) | Contador PDH `Processor Information\% Processor Utility` (mesmo do Gerenciador de Tarefas) |
| Clock efetivo por núcleo | `Processor Frequency × % Processor Performance` (PDH) |
| Limitação de clock (throttling) | `% Performance Limit` e `Thermal Zone\% Passive Limit` (PDH) |
| Temperatura da CPU | LibreHardwareMonitor/OpenHardwareMonitor (WMI) quando aberto; senão zona térmica ACPI do Windows |
| Ventoinhas, tensões, potência, temperaturas por núcleo e placa-mãe | Somente via LibreHardwareMonitor/OpenHardwareMonitor (o Windows não lê o chip Super I/O sem driver de kernel). Sem ele: **N/D** |
| GPU NVIDIA (temp., uso, potência, clocks, ventoinha) | `nvidia-smi` |
| Temperatura de SSD NVMe | Log SMART/Health do controlador (IOCTL) |

Os contadores PDH são registrados pelo nome em inglês (`PdhAddEnglishCounterW`), então
funcionam em qualquer idioma do Windows.

## StressPulse™ — teste de estabilidade (backend/stress_engine.py)

Toda a carga roda em código nativo (hashlib / NumPy / E/S), que libera o GIL do Python,
levando todos os núcleos a 100%. Cada subsistema **verifica o próprio resultado**:

- **CPU:** SHA-256 e BLAKE2b sobre 1 MiB; cada hash é comparado ao hash de referência.
- **FPU:** kernel float64 (sin, cos, sqrt, exp) vetorizado; resultado comparado bit a bit.
- **Cache:** leitura aleatória (gather) em 8 MiB com soma de verificação.
- **RAM:** blocos de 64 MiB com padrões 0x55/0xAA/0xFF/0x00, endereço próprio,
  endereço invertido e aleatório com semente — 100% das palavras de 64 bits conferidas.
- **Disco:** grava e relê 256 MiB sem cache do Windows (`FILE_FLAG_NO_BUFFERING`),
  comparando o hash BLAKE2b de cada bloco.
- **GPU:** shader WebGL2 pesado em 1920×1080 executado pela interface; o FPS real é
  enviado ao backend e exibido.

Qualquer divergência é contada como **erro** — o mesmo critério das ferramentas de
estabilidade profissionais (um único erro indica sistema instável).

## RAMGuard™ — teste de memória (backend/memory_engine.py)

Tamanho automático = 50% da RAM livre (75% no modo profundo), nunca forçando paginação.

| Modo | Passes | Algoritmos |
|---|---|---|
| Rápido | 1 | Bits sólidos, xadrez, endereço próprio, inversões móveis, walking ones (8), aleatório |
| Padrão | 2 | + walking ones (64 posições) e segunda semente aleatória |
| Profundo | 4 | + teste de retenção de carga (bit fade, 2 × 60 s de repouso) |

A duração é a do trabalho real: não há pausas artificiais para "parecer" mais lento.

## SurfaceScan™ — superfície do disco (backend/disk_scan_engine.py)

- Lê o **disco físico** (`\\.\PhysicalDriveN`) somente leitura, sem cache, em blocos de 1 MiB.
- 1.200 regiões: modo rápido lê 32 MiB em cada região (amostra distribuída por todo o LBA);
  modo completo lê **100% dos setores**.
- Cada célula mostra a pior latência da região (< 20 ms, 20–150 ms, ≥ 150 ms ou erro
  confirmado por releitura) e a curva de transferência MB/s ao longo do disco.

## DiskSpeed — benchmark (backend/disk_benchmark_engine.py)

- Motor DiskSpd (Microsoft), sem cache do Windows, arquivo pré-preenchido com dados aleatórios
  incompressíveis.
- 1 s de aquecimento descartado + 5 s de medição por teste, 2 s de pausa entre testes.
- Resultado = melhor passe; média e coeficiente de variação entre passes também são guardados.

## Benchmark de CPU (backend/hardware_monitor.py)

- SHA-256, BLAKE2b, zlib e FPU (NumPy) — 3 s de aquecimento + 20 s medidos por fase (≈ 50 s no total).
- Uma amostra de vazão por segundo; o **coeficiente de variação** entre as amostras é exibido
  junto do resultado (variação baixa = medição confiável; alta = throttling ou interferência).
- O fator multi/single reflete o escalonamento real entre núcleos.
- Não inicia enquanto o StressPulse ou o StressBench estiverem rodando (falsearia o resultado).

## StressBench™ — benchmark de estresse em loops (backend/stress_bench_engine.py)

- Mesma carga fixa em **todas** as threads lógicas, sem pausas: cada "quadro" é SHA-256 de 1 MiB
  + zlib nível 6 de 256 KiB + kernel float64 de 128 Ki elementos. Todo resultado é comparado
  com a referência calculada antes do teste; qualquer divergência conta como erro de cálculo.
- 5 s de aquecimento descartados, depois N loops de duração fixa:
  Rápido 10 × 30 s · Padrão 20 × 60 s · Extremo 40 × 60 s.
- Pontuação do loop = quadros por segundo × 10. **Estabilidade = pior loop ÷ melhor loop.**
- **Aprovado** somente com todos os loops concluídos, estabilidade ≥ 97% e zero erros de cálculo.
- Em cada loop são registrados temperatura (com a fonte), clock efetivo, potência e limitação de clock.
- Resultados completos ficam salvos em `%LOCALAPPDATA%\WinShieldPro\stressbench_history.json`.

## Teste de velocidade da internet (backend/network_engine.py)

- Latência, jitter e perda com 10 pings. Jitter = média da diferença entre amostras consecutivas.
- Download: 6 conexões simultâneas por 15 s; upload: 4 conexões por 12 s (servidores Cloudflare).
- Os 2 s iniciais de cada fase (aceleração do TCP) são descartados; o resultado é o total
  transferido depois disso dividido pelo tempo medido.
- Se o upload não puder ser medido, a interface mostra 0 — **nunca** é estimado a partir do download.

## Otimização (backend/optimizer_engine.py)

- O estado de cada ajuste é lido diretamente do registro e dos serviços do Windows
  (`/api/optimize/state`) e exibido na tela como Aplicado / Pendente / Ação pontual.
- Uma etapa só aparece como concluída se o comando retornar código 0 **e** a releitura do Windows
  confirmar o ajuste; caso contrário aparece "Não confirmado" ou "Falhou".
- SFC, DISM e CHKDSK rodam até o fim (limite de 30–60 min), em vez de serem cortados em 2 min.

## Energia (backend/power_engine.py)

- Plano ativo e configurações (estado mínimo/máximo da CPU, Boost, núcleos estacionados, ASPM,
  tempos de tela/suspensão/disco) lidos com `powercfg /qh` — independente do idioma do Windows.
- Cada alteração é aplicada ao plano ativo e confirmada relendo o valor do `powercfg`.

## Informações de hardware

- Caches L1/L2/L3 lidos de `GetLogicalProcessorInformation` (tamanho e associatividade reais).
- Instruções listadas apenas quando confirmadas por `IsProcessorFeaturePresent`.
- Módulos de RAM: tipo pelo código SMBIOS, velocidade configurada × nominal, tensão SPD.
  Campos não informados pelo firmware aparecem como "Não informado"/N/D.
