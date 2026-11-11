package com.preciousbearing.vocara;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VocaraUpdatePlugin.class);
        registerPlugin(VocaraSavePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
