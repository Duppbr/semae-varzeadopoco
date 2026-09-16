package com.semae.varzeadopoco;

import android.content.Context;
import android.content.Intent;
import android.content.ClipData;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
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
    public void sharePdf(PluginCall call) {
        String base64 = call.getString("base64", "");
        String filename = call.getString("filename", "semae.pdf");
        if (!filename.matches("[a-zA-Z0-9_-]+\\.pdf") || base64.isEmpty() || base64.length() > 14000000) {
            call.reject("PDF invalido ou maior que 10 MB.");
            return;
        }
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (bytes.length < 5 || !new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) {
                call.reject("Arquivo nao e um PDF.");
                return;
            }
            File directory = new File(getContext().getCacheDir(), "pdfs");
            if (!directory.exists() && !directory.mkdirs()) throw new java.io.IOException("Cache indisponivel");
            // Retencao curta sem apagar arquivos que outro app ainda pode estar lendo.
            File[] antigos = directory.listFiles();
            if (antigos != null) for (File f : antigos) {
                if (f.lastModified() < System.currentTimeMillis() - 86400000L) f.delete();
            }
            File file = File.createTempFile(filename.replace(".pdf", "-") , ".pdf", directory);
            try (FileOutputStream stream = new FileOutputStream(file)) { stream.write(bytes); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            // Compartilha o arquivo, nao o link que exigiria login do destinatario.
            getActivity().runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("application/pdf");
                    intent.putExtra(Intent.EXTRA_STREAM, uri);
                    intent.setClipData(ClipData.newRawUri("PDF SEMAE", uri));
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    getActivity().startActivity(Intent.createChooser(intent, "Compartilhar PDF"));
                    call.resolve();
                } catch (Exception error) { call.reject("Nao foi possivel compartilhar o PDF.", error); }
            });
        } catch (Exception error) { call.reject("Nao foi possivel preparar o PDF.", error); }
    }
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
