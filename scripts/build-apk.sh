#!/usr/bin/env bash
# بناء APK بلا Android Studio. يتطلّب أدوات محلية مثبّتة في C:/Users/WF2/android-build
# (JDK 21 + Android SDK سطر الأوامر). غيّر server.url في capacitor.config.ts أولاً.
set -e
export JAVA_HOME="C:/Users/WF2/android-build/jdk21/jdk-21.0.12.1+1"
export ANDROID_HOME="C:/Users/WF2/android-build/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

cd "$(dirname "$0")/.."   # جذر المشروع
echo "→ npx cap sync android (ينسخ الإعداد المحدّث)"
npx cap sync android
echo "→ gradle assembleDebug"
cd android
./gradlew assembleDebug --no-daemon
APK="app/build/outputs/apk/debug/app-debug.apk"
OUT="../beit-expenses.apk"
cp "$APK" "$OUT"
echo "✔ APK: $(cd .. && pwd)/beit-expenses.apk"
