document.documentElement.classList.remove('no-js');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const L=()=>document.documentElement.lang;

/* ===== configurator data ===== */
const DIVS=[
 {id:'coord',en:'Coordination & concept support',ar:'التنسيق ودعم الفكرة'},
 {id:'fnb',en:'Catering & F&B',ar:'الضيافة والمأكولات والمشروبات'},
 {id:'rent',en:'Furniture & rentals',ar:'الأثاث والتأجير'},
 {id:'crew',en:'Crew & hosts',ar:'الطاقم والمضيفون'},
 {id:'prod',en:'Custom counter / booth production',ar:'كاونتر أو جناح مخصص'},
 {id:'avl',en:'Audio, video & lighting',ar:'الصوت والصورة والإضاءة'}
];
const SUBS={
 coord:[['Event planning','تخطيط الفعاليات'],['Supplier management','إدارة الموردين'],['Show flow','مسار العرض'],['On-ground execution','التنفيذ الميداني'],['Closeout reporting','تقرير الإغلاق']],
 fnb:[['Corporate catering','ضيافة الشركات'],['VIP hospitality','ضيافة كبار الشخصيات'],['Coffee breaks','استراحات القهوة'],['Saudi welcome service','الضيافة السعودية'],['F&B activations','تفعيلات المأكولات والمشروبات'],['Private dining','العشاء الخاص'],['Crew meals','وجبات الطاقم']],
 rent:[['Lounge setups','جلسات ضيافة'],['Tables & chairs','طاولات وكراسي'],['Counters & service stations','كاونترات ومحطات خدمة'],['Decor assets','عناصر ديكور'],['Event equipment','معدات فعاليات']],
 crew:[['Hosts','مضيفون'],['Ushers','منظمون'],['Waiters','نُدُل'],['Baristas','باريستا'],['Runners & loaders','مساعدون وعمال تحميل'],['Technicians','تقنيون'],['Supervisors','مشرفون'],['Event managers','مديرو فعاليات']],
 prod:[['Wood counters','كاونترات خشبية'],['Booths','أجنحة'],['Backdrops','خلفيات'],['Stages','منصات'],['Branded installations','تركيبات تحمل الهوية'],['Scenic builds','أعمال ديكورية'],['Product displays','عروض منتجات']],
 avl:[['Audio','صوت'],['Video','فيديو'],['Lighting','إضاءة'],['Screens','شاشات'],['Microphones','ميكروفونات'],['Technical crew','طاقم تقني'],['Show support','دعم أثناء العرض']]
};
const PKGS=[
 {id:'corp',en:'Corporate Essentials',ar:'أساسيات الشركات',inc:['coord','fnb','rent','crew'],
  den:'For meetings, trainings, and executive lunches. Includes coordination, catering, furniture, crew, and delivery.',
  dar:'للاجتماعات، التدريبات، ووجبات الغداء التنفيذية. يشمل التنسيق، الضيافة، الأثاث، الطاقم، والتوصيل.'},
 {id:'brand',en:'Brand Activation Support',ar:'دعم تفعيل العلامات',inc:['coord','fnb','crew','prod','avl'],
  den:'For product launches, retail activations, and pop-ups. Includes concept support, custom counter/booth, F&B, hosts, and AVL.',
  dar:'لإطلاق المنتجات، التفعيلات التجارية، والمتاجر المؤقتة. يشمل دعم الفكرة، كاونتر أو جناح مخصص، الضيافة، المضيفين، والتقنيات.'},
 {id:'full',en:'Full Event Delivery',ar:'تنفيذ الفعالية بالكامل',inc:['coord','fnb','rent','crew','prod','avl'],
  den:'For clients needing one accountable partner. Includes events, hospitality, production, AVL, rentals, and manpower.',
  dar:'للعملاء الذين يحتاجون إلى شريك واحد مسؤول. يشمل الفعاليات، الضيافة، الإنتاج، التقنيات، التأجير، والقوى العاملة.'},
 {id:'custom',en:'Custom',ar:'مخصصة',inc:[],
  den:'Build your own. Switch on the divisions you need.',
  dar:'صمّم باقتك الخاصة. فعّل الأقسام التي تحتاجها.'}
];
const T={included:{en:'Included',ar:'مشمول'},addon:{en:'Add-on',ar:'إضافة'},sel:{en:'Selected',ar:'محدد'},
  refine:{en:'Refine',ar:'تخصيص'},
  count:{en:(n,a)=>n+' included'+(a?' · '+a+' add-on'+(a>1?'s':''):''),ar:(n,a)=>n+' مشمول'+(a?' · '+a+' إضافة':'')},
  countC:{en:n=>n?n+' selected':'Nothing selected yet',ar:n=>n?n+' محدد':'لم يتم تحديد شيء بعد'},
  svc:{en:n=>n+(n>1?' services':' service'),ar:n=>n+(n>1?' خدمات':' خدمة')},
  empty:{en:'Switch on a division to start.',ar:'فعّل قسماً للبدء.'},
  subj:{en:'Brief request',ar:'طلب'},
  lab:{en:['Package','Included','Add-ons','Selected','Services','Date','Venue','Estimated guests','Company / contact','Event type'],
       ar:['الباقة','المشمول','الإضافات','المحدد','الخدمات','التاريخ','الموقع','عدد الضيوف المتوقع','الشركة / جهة الاتصال','نوع الفعالية']},
  none:{en:'None',ar:'لا يوجد'}};
let pkg='full', addons=new Set(), subs=new Set(), open=new Set();
const curP=()=>PKGS.find(p=>p.id===pkg);
const isOn=(P,id)=>P.inc.includes(id)||addons.has(id);
const nm=(sv,l)=>l==='ar'?sv[1]:sv[0];
const chosen=(id,l)=>SUBS[id].filter((_,i)=>subs.has(id+':'+i)).map(sv=>nm(sv,l));

function renderCfg(){
  const l=L(), P=curP(), custom=P.id==='custom';
  const pk=$('#pkgs'); pk.textContent='';
  PKGS.forEach(p=>{
    const b=document.createElement('button');
    b.type='button';b.className='pkg';b.setAttribute('role','radio');
    b.setAttribute('aria-checked',String(p.id===pkg));b.textContent=p[l];
    b.addEventListener('click',()=>{pkg=p.id;addons.clear();subs.clear();open.clear();renderCfg()});
    pk.appendChild(b);
  });
  $('#pkgDesc').textContent=P['d'+l];
  const ul=$('#items'); ul.textContent='';
  DIVS.forEach(d=>{
    const inc=P.inc.includes(d.id), on=isOn(P,d.id);
    const li=document.createElement('li'); li.className='item';
    const row=document.createElement('div'); row.className='row';
    const txt=document.createElement('div'),b=document.createElement('b'),sm=document.createElement('small');
    b.textContent=d[l];
    sm.textContent=inc?T.included[l]:(custom?(on?T.sel[l]:''):T.addon[l]);
    txt.append(b,sm);
    if(on){
      const r=document.createElement('button');r.type='button';r.className='refine';
      r.textContent=T.refine[l];r.setAttribute('aria-expanded',String(open.has(d.id)));
      r.addEventListener('click',()=>{open.has(d.id)?open.delete(d.id):open.add(d.id);renderCfg()});
      txt.appendChild(r);
    }
    row.appendChild(txt);
    if(inc){const c=document.createElement('span');c.className='inc';c.textContent='✓';c.setAttribute('aria-label',T.included[l]);row.appendChild(c)}
    else{
      const s=document.createElement('button');s.type='button';s.className='sw';s.setAttribute('role','switch');
      s.setAttribute('aria-checked',String(on));s.setAttribute('aria-label',d[l]);
      s.addEventListener('click',()=>{
        if(addons.has(d.id)){addons.delete(d.id);open.delete(d.id);[...subs].filter(k=>k.startsWith(d.id+':')).forEach(k=>subs.delete(k))}
        else addons.add(d.id);
        renderCfg();
      });
      row.appendChild(s);
    }
    li.appendChild(row);
    if(on&&open.has(d.id)){
      const chips=document.createElement('div'); chips.className='chips';
      SUBS[d.id].forEach((sv,i)=>{
        const key=d.id+':'+i, c=document.createElement('button');
        c.type='button';c.className='chip';c.textContent=nm(sv,l);
        c.setAttribute('aria-pressed',String(subs.has(key)));
        c.addEventListener('click',()=>{subs.has(key)?subs.delete(key):subs.add(key);renderCfg()});
        chips.appendChild(c);
      });
      li.appendChild(chips);
    }
    ul.appendChild(li);
  });
  $('#sumTitle').textContent=P[l];
  const onDivs=DIVS.filter(d=>isOn(P,d.id)), nAdd=onDivs.filter(d=>!P.inc.includes(d.id)).length;
  $('#sumCount').textContent=custom?T.countC[l](onDivs.length):T.count[l](P.inc.length,nAdd);
  const sl=$('#sumList'); sl.textContent='';
  if(!onDivs.length){const e=document.createElement('li');e.textContent=T.empty[l];sl.appendChild(e)}
  onDivs.forEach(d=>{
    const li=document.createElement('li'); li.append(d[l]);
    const tg=document.createElement('span'); tg.textContent=P.inc.includes(d.id)?T.included[l]:(custom?T.sel[l]:T.addon[l]); li.appendChild(tg);
    const n=chosen(d.id,l).length;
    if(n){const sm=document.createElement('small');sm.textContent=T.svc[l](n);li.appendChild(sm)}
    sl.appendChild(li);
  });
  updateMail();
}

function updateMail(){
  const l=L(), P=curP(), B=T.lab[l], sep=l==='ar'?'، ':', ', custom=P.id==='custom';
  const onDivs=DIVS.filter(d=>isOn(P,d.id));
  const base=onDivs.filter(d=>P.inc.includes(d.id)), adds=onDivs.filter(d=>!P.inc.includes(d.id));
  const lines=[B[0]+': '+P[l]];
  if(custom) lines.push(B[3]+': '+(adds.map(d=>d[l]).join(sep)||T.none[l]));
  else lines.push(B[1]+': '+base.map(d=>d[l]).join(sep), B[2]+': '+(adds.map(d=>d[l]).join(sep)||T.none[l]));
  const svc=onDivs.map(d=>{const c=chosen(d.id,l);return c.length?'  - '+d[l]+': '+c.join(sep):null}).filter(Boolean);
  if(svc.length){lines.push(B[4]+':',...svc)}
  const v=id=>($('#'+id).value||'').trim();
  const CL=l==='ar'?['الاسم','الجوال / واتساب','البريد الإلكتروني','الشركة','طريقة التواصل المفضلة']:['Name','Mobile / WhatsApp','Email','Company','Preferred contact'];
  const prefTxt=({WhatsApp:l==='ar'?'واتساب':'WhatsApp',Call:l==='ar'?'اتصال':'Call',Email:l==='ar'?'بريد إلكتروني':'Email'})[$('#fPref').value];
  lines.unshift(CL[0]+': '+v('fName'),CL[1]+': '+v('fPhone'),CL[2]+': '+v('fMail'),CL[3]+': '+v('fCo'),CL[4]+': '+prefTxt,'');
  lines.push('',B[9]+': ',B[5]+': '+v('fDate'),B[6]+': '+v('fVenue'),B[7]+': '+v('fGuests'));
  const subject=T.subj[l]+' — '+P[l];
  window.__brief={subject,body:lines.join('\n'),pkg:P[l]};
  $('#sumCta').href='mailto:info@laftah.me?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n'));
}
['fDate','fVenue','fGuests','fName','fPhone','fMail','fCo'].forEach(id=>$('#'+id).addEventListener('input',()=>{updateMail();if($('#'+id).getAttribute('aria-invalid')==='true')checkYou(false)}));
$('#fPref').addEventListener('change',updateMail);
function checkYou(show){
  const l=L(),v=id=>($('#'+id).value||'').trim();
  const ok={fName:v('fName').length>=2,fPhone:(v('fPhone').match(/\d/g)||[]).length>=7,fMail:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('fMail'))};
  Object.keys(ok).forEach(k=>{if(show||$('#'+k).getAttribute('aria-invalid')==='true')$('#'+k).setAttribute('aria-invalid',String(!ok[k]))});
  const all=Object.values(ok).every(Boolean);
  $('#reqHint').textContent=all||!show?'':(l==='ar'?'يرجى إدخال الاسم ورقم الجوال وبريد إلكتروني صحيح قبل الإرسال.':'Please add your name, mobile number and a valid email before sending.');
  return all;
}
const FORM=window.LAFTAH_FORM||{};
const SENT={
  ok:{en:['Thank you. Your brief has been sent.','We have your details and will contact you by %PREF% to confirm the scope. Prefer to talk now? Message us on WhatsApp.'],ar:['شكراً لك، تم إرسال طلبك.','وصلتنا بياناتك وسنتواصل معك عبر %PREF% لتأكيد النطاق. تفضّل الحديث الآن؟ راسلنا عبر واتساب.']},
  mail:{en:['Your email is ready.','Press Send in your email app to finish. If nothing opened, send the same brief on WhatsApp instead.'],ar:['رسالتك جاهزة.','اضغط إرسال في تطبيق البريد لإتمام الطلب. وإن لم يُفتح شيء، أرسل الطلب نفسه عبر واتساب.']},
  fail:{en:['We could not send it automatically.','Your email app should open with the brief ready to send. You can also send it on WhatsApp.'],ar:['تعذّر الإرسال تلقائياً.','يجب أن يُفتح تطبيق البريد والطلب جاهز للإرسال. ويمكنك أيضاً إرساله عبر واتساب.']}
};
let sentMode=null;
function showSent(mode){
  sentMode=mode;
  const l=L(),T2=SENT[mode][l];
  const pref=({WhatsApp:l==='ar'?'واتساب':'WhatsApp',Call:l==='ar'?'اتصال':'a call',Email:l==='ar'?'البريد الإلكتروني':'email'})[$('#fPref').value];
  $('#sentTitle').textContent=T2[0];
  $('#sentText').textContent=T2[1].replace('%PREF%',pref);
  $('#sentWa').textContent=l==='ar'?'أرسل الطلب عبر واتساب':'Send it on WhatsApp';
  const b=window.__brief||{subject:'',body:''};
  $('#sentWa').href='https://wa.me/966565616566?text='+encodeURIComponent(b.subject+'\n\n'+b.body);
  document.querySelector('.summary').classList.add('is-sent');
  $('#sentBox').hidden=false;
  $('#sentBox').scrollIntoView({block:'nearest',behavior:'smooth'});
}
$('#sentEdit').addEventListener('click',()=>{
  sentMode=null;$('#sentBox').hidden=true;document.querySelector('.summary').classList.remove('is-sent');
  const btn=$('#sumCta');btn.removeAttribute('aria-disabled');
});
async function postBrief(){
  const v=id=>($('#'+id).value||'').trim(),b=window.__brief;
  const payload={subject:'LAFTAH brief — '+b.pkg,from_name:'LAFTAH website',name:v('fName'),email:v('fMail'),_replyto:v('fMail'),phone:v('fPhone'),company:v('fCo'),preferred_contact:v('fPref'),language:L(),package:b.pkg,message:b.body,botcheck:'',_gotcha:''};
  if(FORM.accessKey)payload.access_key=FORM.accessKey;
  const res=await fetch(FORM.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
  let data={};try{data=await res.json()}catch(e){}
  if(!res.ok||data.success===false||data.ok===false)throw new Error('send failed');
}
$('#sumCta').addEventListener('click',async e=>{
  if(!checkYou(true)){e.preventDefault();const bad=document.querySelector('.you [aria-invalid="true"]');if(bad)bad.focus();return}
  updateMail();
  if($('#fHp').value){e.preventDefault();showSent('ok');return}   /* honeypot: pretend success */
  if(!FORM.endpoint){showSent('mail');return}                      /* no form service yet: open email app */
  e.preventDefault();
  const btn=$('#sumCta'),label=btn.textContent;
  btn.setAttribute('aria-disabled','true');btn.textContent=L()==='ar'?'جارٍ الإرسال…':'Sending…';
  try{await postBrief();btn.textContent=label;showSent('ok')}
  catch(err){btn.textContent=label;btn.removeAttribute('aria-disabled');showSent('fail');location.href=btn.href}
});
$('#dBtn').addEventListener('click',()=>{
  const g=$('#dGrid'), o=g.hidden; g.hidden=!o; $('#dBtn').setAttribute('aria-expanded',String(o));
});

/* ===== language ===== */
const langBtn=$('#lang');
function introText(){
  const c=document.getElementById('fCopy');if(!c)return;
  const h=c.querySelector('h2');
  c.classList.remove('go');
  const words=h.textContent.trim().split(/\s+/);
  h.textContent='';
  words.forEach((w,i)=>{
    const o=document.createElement('span');o.className='w';
    const n=document.createElement('span');n.className='wi';n.style.setProperty('--i',i);n.textContent=w;
    o.appendChild(n);h.appendChild(o);
    if(i<words.length-1)h.appendChild(document.createTextNode(' '));
  });
  void c.offsetWidth;
  setTimeout(()=>c.classList.add('go'),60);
}
function setLang(l){
  document.documentElement.lang=l;
  document.documentElement.dir=l==='ar'?'rtl':'ltr';
  $$('[data-en][data-ar]').forEach(el=>{el.textContent=el.dataset[l]});
  $$('[data-href-en][data-href-ar]').forEach(el=>{el.setAttribute('href',el.dataset[l==='ar'?'hrefAr':'hrefEn'])});
  $$('[data-pen]').forEach(el=>{el.placeholder=el.dataset['p'+l]});
  langBtn.textContent=l==='ar'?'English':'عربي';
  syncMore();syncStory();renderCfg();introText();waSync();if($('#reqHint').textContent)checkYou(true);if(sentMode)showSent(sentMode);
  try{localStorage.setItem('laftah-lang',l)}catch(e){}
}


/* ===== work gallery from the story photos ===== */
(function(){
  const g=document.getElementById('workGrid');if(!g)return;
  const cap=[['01','Events','الفعاليات'],['02','Experiences','التجارب'],['03','Production','الإنتاج'],['04','Technical','التقنيات'],['05','Rentals','التأجير'],['06','Crew','الطاقم']];
  [...document.querySelectorAll('.story-photo img')].forEach((im,i)=>{
    const f=document.createElement('figure'),c=cap[i];
    const x=document.createElement('img');x.src=im.src;x.alt='';x.loading='lazy';x.decoding='async';x.setAttribute('style',im.getAttribute('style')||'');x.style.transform='';
    const t=document.createElement('figcaption');
    const b=document.createElement('b');b.textContent=c[0];
    const n=document.createElement('span');n.setAttribute('data-en',c[1]);n.setAttribute('data-ar',c[2]);n.textContent=c[1];
    t.appendChild(b);t.appendChild(n);f.appendChild(x);f.appendChild(t);g.appendChild(f);
  });
})();
/* ===== whatsapp ===== */
const waFab=document.getElementById('waFab');
function waSync(){
  const l=document.documentElement.lang;
  const msg=l==='ar'?'مرحباً لفتة للتجارب، أود الاستفسار عن فعالية.':'Hello LAFTAH Experiences, I would like to ask about an event.';
  document.querySelectorAll('a[href^="https://wa.me/"]:not(.wa-brief)').forEach(a=>a.href='https://wa.me/966565616566?text='+encodeURIComponent(msg));
}
addEventListener('scroll',()=>{waFab.classList.toggle('show',scrollY>innerHeight*0.9)},{passive:true});

/* ===== pinned story ===== */
const steps=$$('.step'),icons=$$('.story-photo img'),sNum=$('#sNum'),sTitle=$('#sTitle');
function syncMore(){
  const l=L();
  $$('.step').forEach(st=>{
    const d=st.dataset.d,ul=st.querySelector('.more ul'),box=st.querySelector('.more'),b=st.querySelector('.more-btn'),open=b.getAttribute('aria-expanded')==='true';
    ul.textContent='';
    (SUBS[d]||[]).forEach(sv=>{const li=document.createElement('li');li.textContent=sv[l==='ar'?1:0];ul.appendChild(li)});
    b.querySelector('.mb-t').textContent=open?(l==='ar'?'عرض أقل':'Read less'):(l==='ar'?'اقرأ المزيد':'Read more');
  });
}
$$('.more-btn').forEach(b=>b.addEventListener('click',()=>{
  const open=b.getAttribute('aria-expanded')!=='true';
  b.setAttribute('aria-expanded',String(open));
  b.nextElementSibling.hidden=!open;syncMore();
}));
let active=0;
function syncStory(){
  const s=steps[active];
  sNum.textContent=s.dataset.n;
  sTitle.textContent=s.querySelector('h3').textContent;
  icons.forEach((ic,i)=>ic.classList.toggle('on',i===active));
  steps.forEach((st,i)=>st.classList.toggle('on',i===active));
}
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){active=steps.indexOf(e.target);syncStory()}}),{rootMargin:'-45% 0px -45% 0px'});
steps.forEach(s=>so.observe(s));

/* ===== reveal ===== */
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -50px 0px'});
$$('.rv').forEach(el=>ro.observe(el));

/* ===== scroll: progress + hero parallax ===== */
const bar=$('#progress'),orbs=$$('.orb'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let ticking=false;
function onScroll(){
  const h=document.documentElement.scrollHeight-innerHeight;
  bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')';
  if(!reduce&&scrollY<innerHeight*1.2) orbs.forEach(o=>{o.style.transform='translateY('+(scrollY*parseFloat(o.dataset.speed))*4+'px)'});
  ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();


/* ===== film intro: frame expands on scroll; loops muted, click for full-screen with sound ===== */
const film=$('#film'),frame=$('#frame'),fCopy=$('#fCopy'),fv=$('#fv');
const lastSrc=fv.querySelector('source:last-of-type');
if(lastSrc)lastSrc.addEventListener('error',()=>{$('#fErr').hidden=false});
if(!reduce){const r=fv.play();if(r&&r.catch)r.catch(()=>{})}
if(reduce){fv.removeAttribute('autoplay');fv.pause()}
function filmUpdate(){
  const pin=innerHeight-64;
  const hr=document.getElementById('hero').getBoundingClientRect();
  const q=Math.min(1,Math.max(0,(innerHeight-hr.top)/pin));
  const t=Math.min(1,Math.max(0,(innerHeight-hr.top)/hr.height));frame.style.opacity=Math.max(0,1-t*1.8);const u=Math.min(1,Math.max(0,(t-.42)/.16));
  const mx=(a,b,u)=>a.map((v,i)=>Math.round(v+(b[i]-v)*u)),C=a=>'rgb('+a.join(',')+')',INK=[44,54,57],OFF=[245,240,232];
  film.style.background=C(mx(INK,OFF,t));
  const H=document.getElementById('hero');H.classList.toggle('lt',t>.5);
  if(reduce||frame.classList.contains('playing'))return;
  const total=film.offsetHeight-pin-(pin+innerHeight*.7);
  let p=Math.min(1,Math.max(0,(64-film.getBoundingClientRect().top)/total));
  p=p*p*(3-2*p);
  const narrow=innerWidth<=680;
  frame.style.width=((narrow?88:58)+(narrow?12:42)*p)+'%';
  frame.style.height=((narrow?60:56)+(narrow?40:44)*p)+'%';
  frame.style.borderRadius=(40*(1-p))+'px';
  fCopy.style.opacity=Math.max(0,1-p*2.4);
}
addEventListener('scroll',filmUpdate,{passive:true});addEventListener('resize',filmUpdate);filmUpdate();
new IntersectionObserver(es=>es.forEach(e=>{
  if(reduce||frame.classList.contains('playing'))return;
  if(e.isIntersecting){const r=fv.play();if(r&&r.catch)r.catch(()=>{})}else fv.pause();
}),{threshold:0}).observe(film);

langBtn.addEventListener('click',()=>setLang(L()==='ar'?'en':'ar'));
let saved='en';try{saved=localStorage.getItem('laftah-lang')||'en'}catch(e){}
setLang(saved);
