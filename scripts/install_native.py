from pathlib import Path
import shutil
import xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1]
java=root/'android/app/src/main/java/com/legendario/editor'
java.mkdir(parents=True,exist_ok=True)
shutil.copyfile(root/'native/android/LegendarioMediaPlugin.java',java/'LegendarioMediaPlugin.java')
activity=java/'MainActivity.java'
text=activity.read_text()
if 'registerPlugin(LegendarioMediaPlugin.class)' not in text:
    if 'onCreate(' in text:
        raise RuntimeError('MainActivity já contém onCreate. Integrar o registo sem substituir código nativo existente.')
    text=text.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;')
    text=text.replace('extends BridgeActivity {','extends BridgeActivity {\n  @Override public void onCreate(Bundle savedInstanceState) {\n    registerPlugin(LegendarioMediaPlugin.class);\n    super.onCreate(savedInstanceState);\n  }')
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
