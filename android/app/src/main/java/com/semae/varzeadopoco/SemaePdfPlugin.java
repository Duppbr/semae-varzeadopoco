package com.semae.varzeadopoco;

import android.content.Context;
import android.content.Intent;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SemaePdf")
public class SemaePdfPlugin extends Plugin {
    @PluginMethod
    public void print(PluginCall call) {
        String title = call.getString("title", "Documento SEMAE");

        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);

                if (webView == null || printManager == null) {
                    call.reject("Servico de impressao indisponivel neste dispositivo.");
                    return;
                }

                // Alteracao: usa o dialogo nativo Android, porque window.print() nao abre no WebView do Capacitor.
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(title);
                printManager.print(title, adapter, new PrintAttributes.Builder().build());
                call.resolve();
            } catch (Exception error) {
                call.reject("Nao foi possivel abrir a impressao Android.", error);
            }
        });
    }

    @PluginMethod
    public void share(PluginCall call) {
        String title = call.getString("title", "Documento SEMAE");
        String text = call.getString("text", "Documento SEMAE");
        String url = call.getString("url", "");
        String dialogTitle = call.getString("dialogTitle", "Compartilhar documento SEMAE");
        String body = url.isEmpty() ? text : text + "\n" + url;

        try {
            // Alteracao: compartilhamento nativo funciona no APK mesmo quando navigator.share falha no WebView.
            Intent sendIntent = new Intent(Intent.ACTION_SEND);
            sendIntent.setType("text/plain");
            sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            sendIntent.putExtra(Intent.EXTRA_TEXT, body);

            Intent chooser = Intent.createChooser(sendIntent, dialogTitle);
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (Exception error) {
            call.reject("Nao foi possivel abrir o compartilhamento Android.", error);
        }
    }
}
