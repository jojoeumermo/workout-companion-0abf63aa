# Como gerar o APK do FitAI Coach

## Pré-requisitos

- [Android Studio](https://developer.android.com/studio) instalado no seu computador
- JDK 17+ (incluído com o Android Studio)
- (Opcional) Uma chave de assinatura para APK de lançamento

---

## Passo 1: Configure a URL da API (obrigatório para IA funcionar no celular)

O app precisa saber onde está o servidor de IA. Você tem duas opções:

### Opção A — Usar o app hospedado no Replit (recomendado)

1. Faça o deploy do projeto no Replit (botão "Publish")
2. Copie a URL do deploy (ex: `https://fitai-coach.replit.app`)
3. Crie um arquivo `.env.android` na raiz do projeto com:
   ```
   VITE_API_BASE_URL=https://fitai-coach.replit.app
   ```
4. Rode o build com essa variável:
   ```bash
   VITE_API_BASE_URL=https://fitai-coach.replit.app npm run cap:sync
   ```

### Opção B — Rodar o servidor localmente

1. Execute o servidor: `npm run server`
2. Descubra o IP local do seu computador (ex: `192.168.1.10`)
3. Build com:
   ```bash
   VITE_API_BASE_URL=http://192.168.1.10:5000 npm run cap:sync
   ```

---

## Passo 2: Baixe o projeto Android

O projeto Android já está gerado na pasta `android/` deste repositório.

Baixe/clone o projeto completo para o seu computador.

---

## Passo 3: Abrir no Android Studio

```bash
# Na raiz do projeto, rode:
npx cap open android
```

Ou abra manualmente o Android Studio → "Open" → selecione a pasta `android/`

---

## Passo 4: Gerar o APK

### APK de Debug (para uso pessoal, sem assinatura)

No Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

Ou via linha de comando na pasta `android/`:
```bash
./gradlew assembleDebug
```

O APK estará em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### APK de Release (assinado, para distribuição)

```bash
./gradlew assembleRelease
```

---

## Passo 5: Instalar no celular

1. Ative **"Fontes desconhecidas"** nas configurações do Android
   - Configurações → Segurança → Instalar apps desconhecidos
2. Copie o APK para o celular
3. Abra o arquivo APK no celular para instalar

Ou via ADB (cabo USB):
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Funcionalidades no APK

| Funcionalidade | Funciona offline? | Precisa de internet? |
|---|---|---|
| Treinos / histórico / progresso | ✅ Sim | Não |
| Câmera (análise de postura) | ✅ Sim | Não |
| AI Coach (chat) | ❌ | Sim (OpenAI) |
| Análise nutricional com IA | ❌ | Sim (OpenAI) |

---

## Scripts disponíveis

```bash
# Rebuildar e sincronizar o Android após mudanças no código
npm run cap:sync

# Abrir no Android Studio
npm run cap:open

# Build completo debug (precisa de JDK + Android SDK)
npm run cap:build:debug

# Build completo release
npm run cap:build:release
```

---

## Ícones e Splash Screen

- Ícones: `android/app/src/main/res/mipmap-*/`
- Splash screen: `android/app/src/main/res/drawable/splash.png`
- Para customizar, substitua essas imagens e rode `npm run cap:sync`
