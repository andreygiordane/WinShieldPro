# 🔐 Certificados de Assinatura Digital (Code Signing)

Esta pasta é reservada para armazenamento **local** de certificados digitais utilizados na assinatura de binários executáveis (`.exe`) do WinShield Pro via Microsoft Authenticode.

---

### ⚠️ Regras Críticas de Segurança

1. **NUNCA suba arquivos desta pasta para repositórios Git públicos ou remotos.**
2. O arquivo `.gitignore` desta pasta e da raiz do projeto bloqueiam por padrão qualquer extensão de segurança:
   - `*.pfx` (Arquivo com chave privada de assinatura)
   - `*.p12` (Container de certificado PKCS#12)
   - `*.cer` / `*.crt` (Certificado de chave pública)
   - `*.key` / `*.pem` (Chaves privadas)
3. Caso necessite gerar um novo certificado local para testes de desenvolvimento, execute o script em `scripts/sign_app.ps1`.
