; ============================================================================
; WinShield Pro - Instalador (Inno Setup 6.3+)
; Compilado pelo build_exe.bat:  ISCC /DAppVersion=7.6 installer\WinShieldPro.iss
; Empacota a pasta gerada pelo PyInstaller (dist\WinShieldPro) num único Setup.exe.
; ============================================================================

#ifndef AppVersion
  #define AppVersion "7.6"
#endif
#ifndef SourceDir
  #define SourceDir "..\dist\WinShieldPro"
#endif
#define AppName "WinShield Pro"
#define AppExe "WinShieldPro.exe"
; ID fixo: instalar uma versão nova por cima atualiza em vez de duplicar. Nunca altere.
#define AppGuid "{{8F3C2B71-5D4E-4A9B-9C1E-7A2D6B0F4E35}"
; Microsoft Edge WebView2 Runtime (janela nativa do app)
#define WebView2ClientKey "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"

[Setup]
AppId={#AppGuid}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher=Andrey Giordane
AppPublisherURL=https://github.com/andreygiordane/WinShieldPro
AppSupportURL=https://github.com/andreygiordane/WinShieldPro/issues
AppUpdatesURL=https://github.com/andreygiordane/WinShieldPro/releases
VersionInfoVersion={#AppVersion}.0.0
; Pasta padrão: C:\Program Files\WinShield Pro (o técnico pode escolher outra no assistente)
DefaultDirName={autopf}\WinShield Pro
DisableProgramGroupPage=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; Windows 10 1809 ou mais novo
MinVersion=10.0.17763
OutputDir=..\dist
; Nome fixo: o link "releases/latest/download/WinShieldPro-Setup.exe" do README sempre funciona
OutputBaseFilename=WinShieldPro-Setup
SetupIconFile=..\imagens\icone.ico
UninstallDisplayIcon={app}\{#AppExe}
UninstallDisplayName={#AppName}
WizardStyle=modern
; Compressão máxima: o setup fica bem menor que a pasta instalada
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
; Fecha o WinShield aberto antes de atualizar os arquivos
CloseApplications=force
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Área de Trabalho"; GroupDescription: "Atalhos:"
Name: "defenderexclusion"; \
  Description: "Adicionar a pasta de instalação às exclusões do Windows Defender%nO Defender deixa de verificar QUALQUER arquivo nesta pasta. Use só se a equipe for colocar ferramentas portáteis aqui. A exclusão é removida ao desinstalar."; \
  GroupDescription: "Avançado:"; Flags: unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
; WebView2 só é instalado se estiver faltando e o download tiver dado certo (ver [Code])
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; \
  StatusMsg: "Instalando o Microsoft Edge WebView2 Runtime..."; Check: WebView2Downloaded; Flags: waituntilterminated
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Add-MpPreference -ExclusionPath '{app}'"""; \
  StatusMsg: "Configurando a exclusão do Windows Defender..."; Tasks: defenderexclusion; Flags: runhidden waituntilterminated
Filename: "{app}\{#AppExe}"; Description: "Abrir o {#AppName}"; Flags: nowait postinstall skipifsilent shellexec

[UninstallRun]
; Remover uma exclusão que não existe não causa erro, então roda sempre
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Remove-MpPreference -ExclusionPath '{app}'"""; \
  Flags: runhidden waituntilterminated; RunOnceId: "RemoveDefenderExclusion"

; Sem [UninstallDelete] de {app} de propósito: se o técnico escolheu uma pasta com outros
; arquivos (ex.: ferramentas portáteis), eles nunca devem ser apagados pelo desinstalador.

[Code]
var
  DownloadPage: TDownloadWizardPage;
  HasWebView2Setup: Boolean;

function WebView2Installed: Boolean;
var
  Version: String;
begin
  Result :=
    (RegQueryStringValue(HKLM32, '{#WebView2ClientKey}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0')) or
    (RegQueryStringValue(HKCU, '{#WebView2ClientKey}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0'));
end;

function WebView2Downloaded: Boolean;
begin
  Result := HasWebView2Setup;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), nil);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CurPageID = wpReady) and not WebView2Installed then
  begin
    DownloadPage.Clear;
    DownloadPage.Add('https://go.microsoft.com/fwlink/p/?LinkId=2124703', 'MicrosoftEdgeWebview2Setup.exe', '');
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
        HasWebView2Setup := True;
      except
        // Sem internet: o WinShield abre no modo de compatibilidade (Edge em modo app)
        Log('Download do WebView2 falhou: ' + GetExceptionMessage);
      end;
    finally
      DownloadPage.Hide;
    end;
  end;
end;
