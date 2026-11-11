package com.preciousbearing.vocara;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Saves a file the app already wrote into the phone's public Downloads/Vocara folder,
 * so it shows up in the Files app. No storage permission is needed on Android 10 and newer.
 * JS name: VocaraSave.
 */
@CapacitorPlugin(name = "VocaraSave")
public class VocaraSavePlugin extends Plugin {

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String path = call.getString("path");
        String name = call.getString("name");
        String mime = call.getString("mime", "application/octet-stream");
        if (path == null || name == null) { call.reject("path and name are required"); return; }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) { call.reject("Saving to Downloads needs Android 10 or newer"); return; }
        try {
            File src = new File(Uri.parse(path).getPath());
            ContentResolver cr = getContext().getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/Vocara");
            Uri dest = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (dest == null) { call.reject("Could not create the file"); return; }
            try (InputStream in = new FileInputStream(src); OutputStream out = cr.openOutputStream(dest)) {
                if (out == null) { call.reject("Could not open the file"); return; }
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            JSObject ret = new JSObject();
            ret.put("folder", "Download/Vocara");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not save: " + e.getMessage());
        }
    }
}
