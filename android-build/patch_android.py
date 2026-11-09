"""Patches the generated Capacitor Android project: version numbers, update installer permission and file provider.
Signing is done afterwards with apksigner (see .github/workflows/android.yml).
Usage: python3 patch_android.py <android dir> <version code> <version name>"""
import re, sys
root, vcode, vname = sys.argv[1], sys.argv[2], sys.argv[3]

def sub1(pattern, repl, s, what):
    s2, n = re.subn(pattern, repl, s, count=1, flags=re.S)
    if not n:
        sys.exit('Could not patch: ' + what)
    return s2

g = root + '/app/build.gradle'
s = open(g).read()
s = sub1(r'versionCode\s+\d+', 'versionCode %d' % int(vcode), s, 'versionCode')
s = sub1(r'versionName\s+"[^"]*"', 'versionName "%s"' % vname, s, 'versionName')
open(g, 'w').write(s)

m = root + '/app/src/main/AndroidManifest.xml'
x = open(m).read()
for perm in ('REQUEST_INSTALL_PACKAGES', 'ACCESS_NETWORK_STATE'):
    if perm not in x:
        x = sub1(r'<application', '<uses-permission android:name="android.permission.%s" />\n    <application' % perm, x, 'permission ' + perm)
if 'VocaraUpdateProvider' not in x:
    block = '''<provider android:name=".VocaraUpdateProvider" android:authorities="${applicationId}.vocaraupdate" android:exported="false" android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/vocara_update_paths" />
        </provider>
    </application>'''
    x = sub1(r'</application>', block, x, 'application close')
open(m, 'w').write(x)
print('patched android project in', root)
