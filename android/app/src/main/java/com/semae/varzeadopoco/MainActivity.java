package com.semae.varzeadopoco;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Alteracao: registra plugin nativo usado pelos botoes de PDF no Android.
        registerPlugin(SemaePdfPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
