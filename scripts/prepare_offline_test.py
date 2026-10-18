"""Deny network access in the instrumentation APK target, not in the release build."""
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
android = 'http://schemas.android.com/apk/res/android'
tools = 'http://schemas.android.com/tools'
ET.register_namespace('android', android)
ET.register_namespace('tools', tools)
path = root / 'android/app/src/debug/AndroidManifest.xml'
path.parent.mkdir(parents=True, exist_ok=True)
tree = ET.parse(path) if path.exists() else ET.ElementTree(ET.Element('manifest'))
manifest = tree.getroot()
for permission in list(manifest.findall('uses-permission')):
    if permission.get('{'+android+'}name') == 'android.permission.INTERNET':
        manifest.remove(permission)
ET.SubElement(manifest, 'uses-permission', {
    '{'+android+'}name': 'android.permission.INTERNET',
    '{'+tools+'}node': 'remove',
})
tree.write(path, encoding='utf-8', xml_declaration=True)
