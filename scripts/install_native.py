from pathlib import Path
import shutil
import re
import xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1]
java=root/'android/app/src/main/java/com/legendario/editor'
java.mkdir(parents=True,exist_ok=True)
for plugin in (root/'native/android').glob('*.java'):
    shutil.copyfile(plugin,java/plugin.name)
activity=java/'MainActivity.java'
text=activity.read_text()
if 'registerPlugin(LegendarioMediaPlugin.class)' not in text:
    if 'onCreate(' in text:
        raise RuntimeError('MainActivity já contém onCreate. Integrar sem substituir código existente.')
    text=text.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;')
    text=text.replace('extends BridgeActivity {','extends BridgeActivity {\n  @Override public void onCreate(Bundle savedInstanceState) {\n    registerPlugin(LegendarioMediaPlugin.class);\n    super.onCreate(savedInstanceState);\n  }')
for plugin in ['LegendarioExportPlugin','LegendarioRenderPlugin','LegendarioSpeechPlugin']:
    marker='registerPlugin(LegendarioMediaPlugin.class);'
    if 'registerPlugin('+plugin+'.class)' not in text:
        if marker not in text:
            raise RuntimeError('Registo do plugin de mídia não encontrado.')
        text=text.replace(marker,marker+'\n    registerPlugin('+plugin+'.class);')
activity.write_text(text)
manifest=root/'android/app/src/main/AndroidManifest.xml'
ET.register_namespace('android','http://schemas.android.com/apk/res/android')
ns='{http://schemas.android.com/apk/res/android}'
tree=ET.parse(manifest)
node=tree.getroot()
permissions=[('android.permission.READ_EXTERNAL_STORAGE','32'),('android.permission.READ_MEDIA_IMAGES',None),('android.permission.READ_MEDIA_VIDEO',None),('android.permission.READ_MEDIA_VISUAL_USER_SELECTED',None)]
for name,maximum in permissions:
    permission=next((p for p in node.findall('uses-permission') if p.get(ns+'name')==name),None)
    if permission is None:
        permission=ET.SubElement(node,'uses-permission',{ns+'name':name})
    if maximum:
        permission.set(ns+'maxSdkVersion',maximum)
tree.write(manifest,encoding='utf-8',xml_declaration=True)

# Pin all Media3 modules to one tested version and bundle them in the APK.
# No runtime download, FFmpeg binary, CDN, paid service or remote rendering.
gradle=root/'android/app/build.gradle'
text=gradle.read_text()
start='// BEGIN LEGENDARIO MEDIA3'
end='// END LEGENDARIO MEDIA3'
block=start+'''
dependencies {
    implementation "androidx.media3:media3-transformer:1.5.1"
    implementation "androidx.media3:media3-effect:1.5.1"
    implementation "androidx.media3:media3-common:1.5.1"
    implementation "com.alphacephei:vosk-android:0.3.75@aar"
    implementation "net.java.dev.jna:jna:5.18.1@aar"
}
android {
    buildTypes {
        debug {
            applicationIdSuffix ".studio"
            versionNameSuffix "-studio-test"
        }
    }
}
'''+end
if start in text:
    before,rest=text.split(start,1)
    _,after=rest.split(end,1)
    text=before+block+after
else:
    text+='\n'+block+'\n'
gradle.write_text(text)
debug=root/'android/app/src/debug'
debug.mkdir(parents=True,exist_ok=True)
shutil.copyfile(root/'native/androidDebug/AndroidManifest.xml',debug/'AndroidManifest.xml')

variables=root/'android/variables.gradle'
text=variables.read_text()
text=re.sub(r'compileSdkVersion\s*=\s*\d+', 'compileSdkVersion = 35', text)
text=re.sub(r'minSdkVersion\s*=\s*\d+', 'minSdkVersion = 26', text)
variables.write_text(text)

tests=root/'native/androidTest'
if tests.is_dir():
    shutil.copytree(tests,root/'android/app/src/androidTest',dirs_exist_ok=True)
