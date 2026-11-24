/* =====================================================================
   BRASIL UNITV — conexão com o Supabase + contador de visitas
   A chave abaixo é a "anon/public" (pode ficar no site). Nunca cole aqui
   a chave "service_role".
   ===================================================================== */
window.SUPA = {
  url: 'https://olvvrkhrxkbwnfgbgesc.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdnZya2hyeGtid25mZ2JnZXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjQ0MDEsImV4cCI6MjA5MDAwMDQwMX0.ce2OjTtGbNS1nNTZKyHEMpDFvDrgOzK-jpO4vUYgXO8',
  t: { visitas: 'unitv_visitas', artigos: 'unitv_artigos', bucket: 'unitv-blog' }
};
window.SUPA.ok = true;

(function () {
  var S = window.SUPA;
  if (location.pathname.indexOf('/admin') === 0) return;
  try { if (localStorage.getItem('naoContar') === '1') return; } catch (e) {}

  var id = 'v';
  try {
    id = localStorage.getItem('vid');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('vid', id); }
  } catch (e) {}

  var ref = '';
  try { if (document.referrer && new URL(document.referrer).host !== location.host) ref = new URL(document.referrer).host.replace(/^www\./, '').replace(/^m\./, '').replace(/^l\./, '').replace(/^lm\./, ''); } catch (e) {}
  var qs = new URLSearchParams(location.search);
  if (qs.get('utm_source')) ref = qs.get('utm_source');

  // País: 1) serviço gratuito de IP; 2) fuso horário/idioma do aparelho
  var BR_TZ = /^America\/(Sao_Paulo|Belem|Fortaleza|Recife|Bahia|Maceio|Araguaina|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Eirunepe|Santarem|Noronha)$/;
  function paisPorAparelho() {
    try { if (BR_TZ.test(Intl.DateTimeFormat().resolvedOptions().timeZone)) return 'BR'; } catch (e) {}
    var m = (navigator.language || '').match(/-([A-Z]{2})$/i);
    return m ? m[1].toUpperCase() : '';
  }
  function pegaPais() {
    try { var c = sessionStorage.getItem('pais'); if (c) return Promise.resolve(c); } catch (e) {}
    var ctl = window.AbortController ? new AbortController() : null;
    if (ctl) setTimeout(function () { ctl.abort(); }, 2000);
    return fetch('https://api.country.is/', ctl ? { signal: ctl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (j) { return (j && j.country) || paisPorAparelho(); })
      .catch(paisPorAparelho)
      .then(function (c) { try { sessionStorage.setItem('pais', c); } catch (e) {} return c; });
  }

  function envia(pais) {
    var pag = location.pathname + (qs.get('a') ? '?a=' + qs.get('a') : '');
    fetch(S.url + '/rest/v1/' + S.t.visitas, {
      method: 'POST', keepalive: true,
      headers: { apikey: S.key, Authorization: 'Bearer ' + S.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        pagina: pag.slice(0, 300),
        titulo: (document.title || '').replace(/\s*[|—-]\s*Brasil UniTV.*$/, '').slice(0, 200),
        referencia: ref.slice(0, 200),
        dispositivo: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'celular' : 'computador',
        pais: (pais || '').slice(0, 2),
        visitante: String(id).slice(0, 64)
      })
    }).catch(function () {});
  }

  // espera o título final (artigos novos trocam o título depois de carregar)
  var vai = function () { pegaPais().then(function (p) { setTimeout(function () { envia(p); }, qs.get('a') ? 1500 : 0); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vai); else vai();
})();
