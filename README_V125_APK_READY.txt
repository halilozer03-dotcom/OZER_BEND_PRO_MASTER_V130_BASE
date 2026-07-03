ÖZER BEND PRO V125 APK READY

Bu sürüm V124 sade/metalik gri/logo yapısını korur.
Eklenenler:
- package.json içine build komutu eklendi
- vite.config.js eklendi
- capacitor.config.json eklendi
- APK üretimi için hazır yapı

Termux komutları:
cd ~/ozer-v125
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon

APK yolu:
android/app/build/outputs/apk/debug/app-debug.apk
