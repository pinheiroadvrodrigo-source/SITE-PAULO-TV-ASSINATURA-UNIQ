/* =====================================================================
   BRASIL UNITV — conexão com o Supabase + contador de visitas
   Cole aqui os 2 dados do Supabase (Project Settings → API).
   É o ÚNICO lugar onde precisa colar. A chave "anon public" pode ficar
   no site; NUNCA cole aqui a chave "service_role".
   ===================================================================== */
window.SUPA = {
  url: 'COLE_AQUI_A_PROJECT_URL',      // ex.: https://abcdefgh.supabase.co
  key: 'COLE_AQUI_A_CHAVE_ANON_PUBLIC' // começa com eyJ...
};
window.SUPA.ok = /^https:\/\/.+\.supabase\.co$/.test(window.SUPA.url) && window.SUPA.key.length > 40;

(function () {
  var S = window.SUPA;
  if (!S.ok || location.pathname.indexOf('/admin') === 0) return;
  try { if (localStorage.getItem('naoContar') === '1') return; } catch (e) {}
  var id = 'v';
  try {
    id = localStorage.getItem('vid');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('vid', id); }
  } catch (e) {}
  var ref = '';
  try { if (document.referrer && new URL(document.referrer).host !== location.host) ref = new URL(document.referrer).host.replace(/^www\./, ''); } catch (e) {}
  var utm = new URLSearchParams(location.search).get('utm_source');
  if (utm) ref = utm;
  fetch(S.url + '/rest/v1/visitas', {
    method: 'POST', keepalive: true,
    headers: { apikey: S.key, Authorization: 'Bearer ' + S.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      pagina: (location.pathname + (new URLSearchParams(location.search).get('a') ? '?a=' + new URLSearchParams(location.search).get('a') : '')).slice(0, 300),
      referencia: ref.slice(0, 300),
      dispositivo: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'celular' : 'computador',
      visitante: id
    })
  }).catch(function () {});
})();
