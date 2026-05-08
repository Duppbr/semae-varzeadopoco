export function pdfActionScript(fallbackPath: string) {
  return `
    (function () {
      function nativePdf() {
        return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SemaePdf;
      }

      function isNativeApp() {
        return !!(window.Capacitor && (!window.Capacitor.isNativePlatform || window.Capacitor.isNativePlatform()));
      }

      function shareFallback(payload) {
        if (navigator.share) {
          return navigator.share(payload).catch(function (error) {
            if (!error || error.name !== 'AbortError') copyUrl();
          });
        }
        copyUrl();
        return Promise.resolve();
      }

      function copyUrl() {
        var url = window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            alert('Link do documento copiado.');
          }).catch(function () {
            window.prompt('Copie o link do documento:', url);
          });
          return;
        }
        window.prompt('Copie o link do documento:', url);
      }

      window.pdfVoltar = function () {
        var path = window.location.pathname;
        window.location.href = path.endsWith('/pdf') ? path.slice(0, -4) : '${fallbackPath}';
      };

      window.pdfCompartilhar = function () {
        var payload = {
          title: document.title,
          text: 'Documento SEMAE',
          url: window.location.href,
          dialogTitle: 'Compartilhar documento SEMAE'
        };
        var plugin = nativePdf();
        if (plugin && plugin.share) {
          return plugin.share(payload).catch(function () {
            return shareFallback(payload);
          });
        }
        return shareFallback(payload);
      };

      window.pdfImprimir = function () {
        var plugin = nativePdf();
        if (plugin && plugin.print) {
          return plugin.print({ title: document.title }).catch(function () {
            return window.pdfCompartilhar();
          });
        }
        if (isNativeApp()) {
          return window.pdfCompartilhar();
        }
        window.print();
        return Promise.resolve();
      };
    })();
  `;
}

export function pdfActionBarHtml() {
  return [
    '<button class="back-btn" type="button" onclick="pdfVoltar()">&#8592; Voltar</button>',
    '<button class="share-btn" type="button" onclick="pdfCompartilhar()">&#128228; Compartilhar</button>',
    '<button class="print-btn" type="button" onclick="pdfImprimir()">&#128438; Imprimir</button>',
  ].join('');
}
