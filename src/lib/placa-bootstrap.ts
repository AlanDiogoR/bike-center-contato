/**
 * Script bloqueante, no início do body, para a página estática da Netlify.
 * Define `data-utm-source="placa"` antes da primeira pintura, então o CSS
 * troca o CTA sem mismatch de hidratação e sem layout shift.
 * A normalização espelha `normalizeQueryKey` — o teste de paridade trava os dois.
 */
export const PLACA_BOOTSTRAP_SCRIPT = `(function(){
  function normalizeQueryKey(key){
    var plusAsSpace=String(key).replace(/\\+/g," ");
    var decoded=plusAsSpace;
    try{decoded=decodeURIComponent(plusAsSpace);}catch(e){decoded=plusAsSpace;}
    return decoded.replace(/%20/gi," ").trim().toLowerCase().replace(/\\s+/g,"");
  }
  try{
    var params=new URLSearchParams(window.location.search);
    var matched=false;
    params.forEach(function(value,rawKey){
      if(matched)return;
      if(normalizeQueryKey(rawKey)!=="utm_source")return;
      matched=true;
      if(String(value).trim().toLowerCase()==="placa"){
        document.documentElement.setAttribute("data-utm-source","placa");
      }
    });
  }catch(e){}
})();`;
