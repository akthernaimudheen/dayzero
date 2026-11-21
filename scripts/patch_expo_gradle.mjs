// DayZero — Patch Expo Modules Gradle Plugin for Android Gradle Plugin 8.x Compatibility
import fs from 'node:fs';
import path from 'node:path';

const searchPaths = [
  'node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle',
  'app/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle',
  '../node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle',
];

for (const rel of searchPaths) {
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
    } else {
      console.log(`Already patched or target not found in: ${rel}`);
    }
  }
}
