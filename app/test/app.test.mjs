import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Android Expo App Configuration & Assets', () => {
  const appJsonPath = path.resolve('app/app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  it('declares the correct Android application ID and version', () => {
    assert.strictEqual(appJson.expo.name, 'DayZero');
    assert.strictEqual(appJson.expo.android.package, 'com.dayzero.app');
    assert.strictEqual(appJson.expo.android.versionCode, 1);
    assert.strictEqual(appJson.expo.version, '1.0.0');
  });

  it('restricts Android permissions strictly to minimal requirements', () => {
    const permissions = appJson.expo.android.permissions;
    assert.ok(Array.isArray(permissions));
    assert.deepStrictEqual(permissions, ['INTERNET']);
    // Ensure dangerous privacy-invasive permissions are NOT declared
    assert.strictEqual(permissions.includes('READ_CONTACTS'), false);
    assert.strictEqual(permissions.includes('READ_SMS'), false);
    assert.strictEqual(permissions.includes('RECORD_AUDIO'), false);
    assert.strictEqual(permissions.includes('ACCESS_FINE_LOCATION'), false);
  });

  it('verifies the generated AndroidManifest.xml contains only justified permissions', () => {
    const manifestPath = path.resolve('app/android/app/src/main/AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
      const manifest = fs.readFileSync(manifestPath, 'utf8');
      assert.ok(manifest.includes('android.permission.INTERNET'));
      const grantedPermissions = manifest.split('\n')
        .filter(line => line.includes('<uses-permission') && !line.includes('tools:node="remove"'))
        .map(line => line.match(/android:name="([^"]+)"/)?.[1])
        .filter(Boolean);
      assert.deepStrictEqual(grantedPermissions, ['android.permission.INTERNET']);
    }
  });

  it('enforces exact DayZero visual identity in app.json configuration', () => {
    assert.strictEqual(appJson.expo.splash.backgroundColor, '#F6F2E9'); // Ivory
    assert.strictEqual(appJson.expo.android.adaptiveIcon.backgroundColor, '#283D30'); // Deep Olive
  });

  it('verifies all generated Android asset files exist with valid PNG signatures', () => {
    const assetFiles = ['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'];
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    for (const file of assetFiles) {
      const fullPath = path.resolve('app/assets', file);
      assert.ok(fs.existsSync(fullPath), `Missing asset: ${file}`);
      const buf = fs.readFileSync(fullPath);
      assert.ok(buf.length > 50, `Asset ${file} is unexpectedly small: ${buf.length} bytes`);
      assert.deepStrictEqual(buf.subarray(0, 8), pngSignature, `File ${file} has invalid PNG signature`);
    }
  });

  it('verifies the brand color tokens in app/src/theme.ts', async () => {
    const themeContent = fs.readFileSync(path.resolve('app/src/theme.ts'), 'utf8');
    assert.ok(themeContent.includes('#F6F2E9'), 'Must include Ivory #F6F2E9');
    assert.ok(themeContent.includes('#547A61'), 'Must include Sage #547A61');
    assert.ok(themeContent.includes('#283D30'), 'Must include Deep olive #283D30');
    assert.ok(themeContent.includes('#E8EEE3'), 'Must include Pale sage #E8EEE3');
    assert.ok(themeContent.includes('#B87858'), 'Must include Terracotta #B87858');
    assert.ok(themeContent.includes('#D98E79'), 'Must include Coral #D98E79');

    // Verify absence of black or dark blue primary theme
    assert.strictEqual(themeContent.includes('primary: \'#000000\''), false);
    assert.strictEqual(themeContent.includes('primary: \'#000\''), false);
    assert.strictEqual(themeContent.includes('#001F3F'), false); // navy
  });
});
