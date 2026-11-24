/* Contador de visitas (GoatCounter) — Brasil UniTV.
   Para trocar a conta, altere só o CODIGO abaixo. */
(function(){
  var CODIGO = 'brasilunitv';
  if (location.pathname.indexOf('/admin') === 0) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODIGO + '.goatcounter.com/count');
  document.head.appendChild(s);
})();
