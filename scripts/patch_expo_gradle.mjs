// DayZero — Patch Expo Modules Gradle Plugin for Android Gradle Plugin 8.x Compatibility
import fs from 'node:fs';
import path from 'node:path';

// 1. Patch ExpoModulesCorePlugin.gradle for maven-publish / components.release
const corePaths = [
  'node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle',
  'app/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle',
];

for (const rel of corePaths) {
  const full = path.resolve(rel);
  if (fs.existsSync(full)) {
    let content = fs.readFileSync(full, 'utf8');
    if (content.includes('from components.release')) {
      content = content.replace(
        'from components.release',
        'if (components.findByName("release") != null) { from components.release }'
      );
      fs.writeFileSync(full, content, 'utf8');
      console.log(`Successfully patched: ${rel}`);
    }
  }
}

// 2. Patch any build.gradle using expo-module-gradle-plugin (e.g. expo-constants)
function patchModuleGradle(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      patchModuleGradle(full);
    } else if (entry === 'build.gradle') {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('expo-module-gradle-plugin')) {
        console.log(`Patching expo-module-gradle-plugin in: ${full}`);
        content = content.replace(
          /plugins\s*\{\s*id\s*['"]com\.android\.library['"]\s*id\s*['"]expo-module-gradle-plugin['"]\s*\}/g,
          `apply plugin: 'com.android.library'\ndef expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")\napply from: expoModulesCorePlugin\napplyKotlinExpoModulesCorePlugin()`
        );
        content = content.replace(/expoModule\s*\{[^}]*\}/g, '// expoModule');
        fs.writeFileSync(full, content, 'utf8');
        console.log(`Successfully patched: ${full}`);
      }
    }
  }
}

patchModuleGradle(path.resolve('node_modules'));
patchModuleGradle(path.resolve('app/node_modules'));

// 3. Patch Flow readonly properties across react-native Libraries
function patchFlowReadonly(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      patchFlowReadonly(full);
    } else if (full.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('@flow') && /readonly\s+[a-zA-Z0-9_$]+\s*:/.test(content)) {
        content = content.replace(/readonly\s+([a-zA-Z0-9_$]+)\s*:/g, '+$1:');
        fs.writeFileSync(full, content, 'utf8');
        console.log(`Successfully patched Flow readonly in: ${full}`);
      }
    }
  }
}

patchFlowReadonly(path.resolve('node_modules/react-native/Libraries'));
patchFlowReadonly(path.resolve('app/node_modules/react-native/Libraries'));
console.log('DayZero Expo & React Native patching complete.');
