/* Applies content/content.js (edited in /admin) to the page. Runs before app.js. */
(function(){
  var C=window.LAFTAH_CONTENT||{};
  var preview=false;
  try{
    if(/[?&]preview=1/.test(location.search)){
      var d=JSON.parse(localStorage.getItem('laftah_draft')||'null');
      if(d){
        var files={};try{files=JSON.parse(localStorage.getItem('laftah_draft_files')||'{}')}catch(e){}
        var swap=function(v){
          if(typeof v==='string')return files[v]||v;
          if(Array.isArray(v))return v.map(swap);
          if(v&&typeof v==='object'){var o={};for(var k in v)o[k]=swap(v[k]);return o}
          return v;
        };
        C=window.LAFTAH_CONTENT=swap(d);preview=true;
      }
    }
  }catch(e){}
  var S=C.settings||{}, F=C.files||{};
  var digits=function(s){return String(s||'').replace(/[^\d+]/g,'')};
  var q=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
  /* contact details */
  q('[data-c="wa"]').forEach(function(a){if(S.whatsapp)a.href='https://wa.me/'+String(S.whatsapp).replace(/\D/g,'')});
  q('[data-c="email"]').forEach(function(a){if(S.email){a.href='mailto:'+S.email;if(!a.hasAttribute('data-en')&&a.textContent.indexOf('@')>-1)a.textContent=S.email}});
  q('[data-c="phone"]').forEach(function(a){if(S.phone){a.href='tel:'+digits(S.phone);a.textContent=S.phone}});
  /* form key */
  if(S.formKey&&window.LAFTAH_FORM)window.LAFTAH_FORM.accessKey=S.formKey;
  /* page title and description */
  if(S.seoTitle){document.title=S.seoTitle}
  if(S.seoDescription){var md=document.querySelector('meta[name="description"]');if(md)md.setAttribute('content',S.seoDescription)}
  /* profile PDFs */
  q('[data-href-en][data-href-ar]').forEach(function(a){
    if(F.profileEn)a.setAttribute('data-href-en',F.profileEn);
    if(F.profileAr)a.setAttribute('data-href-ar',F.profileAr);
    a.setAttribute('href',a.getAttribute('data-href-en'));
  });
  /* photos (story slideshow; the Our work grid is built from these) */
  var imgs=q('.story-photo img');
  (C.photos||[]).forEach(function(p,i){if(imgs[i]&&p.src)imgs[i].setAttribute('src',p.src)});
  /* text blocks */
  var T=C.text||{};
  Object.keys(T).forEach(function(k){
    var el=document.querySelector('[data-k="'+k.replace(/"/g,'')+'"]');if(!el)return;
    if(T[k].en!=null&&T[k].en!=='')el.setAttribute('data-en',T[k].en);
    if(T[k].ar!=null&&T[k].ar!=='')el.setAttribute('data-ar',T[k].ar);
  });
  if(preview){
    var b=document.createElement('div');
    b.textContent='Preview of unpublished changes — close this tab and press Publish in the admin to make them live.';
    b.setAttribute('style','position:fixed;left:0;right:0;bottom:0;z-index:300;background:#A27B5B;color:#fff;font:700 13px Arial,sans-serif;text-align:center;padding:10px 14px');
    document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(b)});
    if(document.body)document.body.appendChild(b);
  }
})();
