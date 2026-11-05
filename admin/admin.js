/* LAFTAH website admin. Edits content/content.js (+ uploads) in the GitHub repo through the GitHub API. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const SECTIONS={nav:'Menu',film:'Intro film',hero:'Hero',statement:'Statement',story:'What’s inside',process:'How it runs',work:'Our work & booths',about:'About',config:'Build your package',faq:'FAQ',brief:'Contact & brief',footer:'Footer'};
const PAGES=[['dashboard','Dashboard'],['settings','Settings'],['text','Page text'],['packages','Packages'],['services','Services'],['booths','Booths'],['photos','Photos'],['files','Company profile'],['publish','Publish']];

/* ---------- tiny helpers ---------- */
function h(tag,attrs){const el=document.createElement(tag);attrs=attrs||{};
  for(const k in attrs){const v=attrs[k];if(v==null||v===false)continue;
    if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k.slice(0,2)==='on')el.addEventListener(k.slice(2),v);else if(k==='value')el.value=v;else el.setAttribute(k,v===true?'':v)}
  for(let i=2;i<arguments.length;i++){const c=arguments[i];if(c==null||c===false)continue;el.append(c.nodeType?c:document.createTextNode(c))}
  return el}
const clone=o=>JSON.parse(JSON.stringify(o));
const slug=s=>String(s||'x').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'x';
const stamp=()=>new Date().toISOString().replace(/[-:T]/g,'').slice(0,12);
function toast(msg,bad){const t=$('#toast');t.textContent=msg;t.className='toast'+(bad?' bad':'');t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,bad?6000:2800)}
const b64=s=>btoa(unescape(encodeURIComponent(s)));
const unb64=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,''))));

/* ---------- state ---------- */
const S={repo:'',branch:'main',token:'',content:null,orig:'',origSha:'',defaults:{},files:new Map(),last:null};
const store=()=>localStorage.getItem('laftah_admin_token')?localStorage:sessionStorage;

/* ---------- GitHub API ---------- */
async function gh(path,opt){opt=opt||{};
  const r=await fetch('https://api.github.com/'+path,{method:opt.method||'GET',headers:Object.assign({'Authorization':'Bearer '+S.token,'Accept':opt.raw?'application/vnd.github.raw+json':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body?JSON.stringify(opt.body):undefined,cache:'no-store'});
  if(!r.ok){let m='';try{m=(await r.json()).message}catch(e){}const e=new Error(m||('GitHub error '+r.status));e.status=r.status;throw e}
  return opt.raw?r.text():r.json()}
const parseContent=js=>JSON.parse(js.slice(js.indexOf('{'),js.lastIndexOf('}')+1));
const serialize=c=>'/* Laftah site content. Edited by the admin app (/admin). */\nwindow.LAFTAH_CONTENT = '+JSON.stringify(c,null,1)+';\n';

async function loadAll(){
  const f=await gh(`repos/${S.repo}/contents/content/content.js?ref=${encodeURIComponent(S.branch)}`);
  const js=unb64(f.content);S.origSha=f.sha;S.orig=JSON.stringify(parseContent(js));
  S.content=parseContent(js);
  const html=await gh(`repos/${S.repo}/contents/index.html?ref=${encodeURIComponent(S.branch)}`,{raw:true});
  const doc=new DOMParser().parseFromString(html,'text/html');S.defaults={};
  doc.querySelectorAll('[data-k]').forEach(el=>{const k=el.getAttribute('data-k');
    S.defaults[k]={key:k,sec:k.split('.')[0],tag:el.tagName.toLowerCase(),en:el.getAttribute('data-en')||'',ar:el.getAttribute('data-ar')||''}});
  try{const c=await gh(`repos/${S.repo}/commits?path=content/content.js&sha=${encodeURIComponent(S.branch)}&per_page=1`);if(c[0])S.last={date:c[0].commit.author.date,msg:c[0].commit.message.split('\n')[0]}}catch(e){}
  // restore unpublished draft
  try{const d=localStorage.getItem('laftah_draft');if(d&&d!==S.orig&&confirm('You have unpublished changes saved on this device. Restore them?')){S.content=JSON.parse(d);
    const fl=JSON.parse(localStorage.getItem('laftah_draft_files')||'{}');Object.keys(fl).forEach(p=>S.files.set(p,{dataUrl:fl[p],pending:true,needsBlob:true}))}}catch(e){}
  // normalise
  const c=S.content;c.settings=c.settings||{};c.files=c.files||{};c.text=c.text||{};c.photos=c.photos||[];c.divisions=c.divisions||[];c.packages=c.packages||[];c.booths=c.booths||[];
}
const isDirty=()=>JSON.stringify(S.content)!==S.orig||[...S.files.values()].some(f=>f.pending);
let saveT;
function touch(){clearTimeout(saveT);saveT=setTimeout(()=>{try{
    if(JSON.stringify(S.content)===S.orig&&![...S.files.values()].some(f=>f.pending)){localStorage.removeItem('laftah_draft');localStorage.removeItem('laftah_draft_files')}
    else{localStorage.setItem('laftah_draft',JSON.stringify(S.content));const fl={};S.files.forEach((v,p)=>{if(v.pending&&v.dataUrl&&v.image)fl[p]=v.dataUrl});localStorage.setItem('laftah_draft_files',JSON.stringify(fl))}
  }catch(e){}},300);$('#dirtyDot').hidden=!isDirty()}

/* ---------- uploads ---------- */
function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
async function addImage(file,base,maxW){
  if(!file)return null;
  if(!/^image\//.test(file.type)){toast('Please choose an image file.',true);return null}
  const bmp=await createImageBitmap(file);const sc=Math.min(1,maxW/bmp.width);
  const cv=document.createElement('canvas');cv.width=Math.round(bmp.width*sc);cv.height=Math.round(bmp.height*sc);
  cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
  const blob=await new Promise(r=>cv.toBlob(r,'image/webp',0.86));
  const path=`assets/uploads/${slug(base)}-${stamp()}.webp`;
  const dataUrl=await readFile(blob);
  S.files.set(path,{blob,dataUrl,pending:true,image:true});touch();return path}
async function addPdf(file,base){
  if(!file)return null;if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name)){toast('Please choose a PDF file.',true);return null}
  if(file.size>20*1024*1024){toast('That PDF is over 20 MB.',true);return null}
  const path=`downloads/${base}-${stamp()}.pdf`;S.files.set(path,{blob:file,pending:true,image:false,name:file.name});touch();return path}
const srcFor=p=>{const f=S.files.get(p);return f&&f.dataUrl?f.dataUrl:('../'+p)};

/* ---------- field builders ---------- */
function field(label,obj,key,opt){opt=opt||{};
  const i=h(opt.area?'textarea':'input',{value:obj[key]||'',dir:opt.ar?'rtl':null,class:opt.ar?'ar':'',rows:opt.area?3:null,placeholder:opt.ph||''});
  i.addEventListener('input',()=>{obj[key]=i.value;touch();opt.on&&opt.on()});
  return h('label',{},label,i)}
function langPair(label,obj,kEn,kAr,area){return h('div',{class:'grid2'},field(label+' (English)',obj,kEn,{area}),field(label+' (العربية)',obj,kAr,{area,ar:1}))}
const sectionCard=(title,note,...kids)=>h('div',{class:'card'},h('h3',{text:title}),note?h('p',{class:'note',text:note}):null,...kids);

/* ---------- pages ---------- */
const P={};
P.dashboard=function(m){
  const c=S.content,ed=Object.keys(c.text).length,tot=Object.keys(S.defaults).length;
  m.append(h('h2',{text:'Dashboard'}),h('p',{class:'sub',text:'Edit your website here. Changes stay in a draft until you press Publish.'}));
  m.append(h('div',{class:'stats'},
    stat(tot,'Text blocks ('+ed+' edited)'),stat(c.packages.length,'Packages'),stat(c.booths.length,'Booth cards'),stat(c.photos.length,'Work photos')));
  const live=siteUrl();
  m.append(sectionCard('Site status',null,
    h('p',{},h('b',{text:'Last published: '}),S.last?new Date(S.last.date).toLocaleString()+' — '+S.last.msg:'unknown'),
    h('p',{},h('b',{text:'Draft: '}),isDirty()?h('span',{class:'bad',text:'unpublished changes'}):h('span',{class:'ok',text:'everything is published'})),
    h('div',{class:'row'},h('a',{class:'btn',href:live,target:'_blank',rel:'noopener',text:'Open live website'}),h('button',{class:'btn',onclick:preview,text:'Preview draft'}),h('button',{class:'btn primary',onclick:()=>go('publish'),text:'Go to Publish'}))));
  m.append(sectionCard('What you can edit',null,h('ul',{class:'list'},
    h('li',{text:'Settings: phone, email, WhatsApp, form key, page title and description.'}),
    h('li',{text:'Page text: every heading and paragraph, in English and Arabic.'}),
    h('li',{text:'Packages, services and booth cards, including images and drawings.'}),
    h('li',{text:'The six work photos and the company profile PDFs.'})),
    h('p',{class:'note',text:'New sections or design changes are not done here. Those still go through a developer.'})))};
const stat=(n,l)=>h('div',{class:'stat'},h('b',{text:String(n)}),h('span',{text:l}));
function siteUrl(){const u=localStorage.getItem('laftah_site_url');if(u)return u;const [o,r]=S.repo.split('/');return r.toLowerCase()===o.toLowerCase()+'.github.io'?`https://${o}.github.io/`:`https://${o}.github.io/${r}/`}

P.settings=function(m){
  const s=S.content.settings;
  m.append(h('h2',{text:'Settings'}),h('p',{class:'sub',text:'Contact details and page information used across the site.'}));
  m.append(sectionCard('Contact',null,h('div',{class:'grid3'},field('Phone (shown on the site)',s,'phone',{ph:'+966 5X XXX XXXX'}),field('Email',s,'email'),field('WhatsApp number (digits only)',s,'whatsapp',{ph:'9665XXXXXXXX'}))));
  m.append(sectionCard('Brief form','Briefs are emailed through Web3Forms. Change this key only if you create a new form.',field('Web3Forms access key',s,'formKey')));
  m.append(sectionCard('Page title and description','Shown on the browser tab and in Google results. Social previews (WhatsApp, LinkedIn) read the original page, so changes here may not appear there.',field('Page title',s,'seoTitle'),h('div',{style:'height:12px'}),field('Page description',s,'seoDescription',{area:1})));
  const u=h('input',{value:localStorage.getItem('laftah_site_url')||'',placeholder:siteUrl()});u.addEventListener('input',()=>{u.value?localStorage.setItem('laftah_site_url',u.value):localStorage.removeItem('laftah_site_url')});
  m.append(sectionCard('Live website address','Used for the “Open live website” button on this device only. Set it to https://laftah.me/ once the domain is connected.',h('label',{},'Address',u)))};

P.text=function(m){
  m.append(h('h2',{text:'Page text'}),h('p',{class:'sub',text:'Every piece of text on the page, in English and Arabic. Leave a box as it is to keep the original. Use Reset on a block to go back to its original.'}));
  const q=h('input',{placeholder:'Search text…'}),sel=h('select',{},h('option',{value:'',text:'All sections'}),...Object.keys(SECTIONS).map(k=>h('option',{value:k,text:SECTIONS[k]})));
  const only=h('label',{class:'chk'},h('input',{type:'checkbox'}),'Edited only');
  const list=h('div',{class:'card'});m.append(h('div',{class:'filters'},q,sel,only),list);
  function draw(){list.textContent='';const term=q.value.trim().toLowerCase(),sc=sel.value,eo=only.querySelector('input').checked;let n=0;
    Object.values(S.defaults).forEach(d=>{
      const o=S.content.text[d.key]||{};const en=o.en!=null?o.en:d.en,ar=o.ar!=null?o.ar:d.ar;
      if(sc&&d.sec!==sc)return;if(eo&&!S.content.text[d.key])return;
      if(term&&!(en+' '+ar+' '+d.key).toLowerCase().includes(term))return;
      if(++n>80)return;
      const row=h('div',{class:'tr'});const tag=h('span',{class:'tag'+(S.content.text[d.key]?' ed':''),text:S.content.text[d.key]?'edited':'original'});
      const rst=h('button',{class:'btn sm',type:'button',text:'Reset',onclick:()=>{delete S.content.text[d.key];touch();draw()}});
      row.append(h('div',{class:'tr-h'},h('b',{text:(SECTIONS[d.sec]||d.sec)}),h('span',{text:'· '+d.tag+' · '+d.key}),h('span',{class:'sp'}),tag,S.content.text[d.key]?rst:null));
      const mk=(lang,val,def)=>{const t=h('textarea',{rows:val.length>90?3:1,class:lang==='ar'?'ar':'',dir:lang==='ar'?'rtl':null,value:val});
        t.addEventListener('input',()=>{const cur=S.content.text[d.key]||{en:d.en,ar:d.ar};cur[lang]=t.value;
          if(cur.en===d.en&&cur.ar===d.ar){delete S.content.text[d.key];tag.textContent='original';tag.className='tag'}else{S.content.text[d.key]=cur;tag.textContent='edited';tag.className='tag ed'}touch()});
        return h('div',{},h('p',{class:'lang-l',text:lang==='en'?'English':'العربية'}),t)};
      row.append(h('div',{class:'grid2'},mk('en',en),mk('ar',ar)));list.append(row)});
    if(!n)list.append(h('p',{class:'note',text:'Nothing matches.'}));
    if(n>80)list.append(h('p',{class:'note',text:'Showing the first 80. Narrow the search or choose a section.'}))}
  [q,sel].forEach(e=>e.addEventListener('input',draw));only.querySelector('input').addEventListener('change',draw);draw()};

P.packages=function(m){
  const c=S.content;m.append(h('h2',{text:'Packages'}),h('p',{class:'sub',text:'The packages visitors choose from in “Build your package”. Included services are locked for the visitor; they can add the rest as extras.'}));
  c.packages.forEach((p,i)=>{
    const chips=h('div',{class:'chips'});
    c.divisions.forEach(d=>{const on=p.inc.includes(d.id);const b=h('button',{type:'button',class:'chipb','aria-pressed':String(on),text:d.en});
      b.addEventListener('click',()=>{const k=p.inc.indexOf(d.id);k>-1?p.inc.splice(k,1):p.inc.push(d.id);b.setAttribute('aria-pressed',String(p.inc.includes(d.id)));touch()});chips.append(b)});
    const prot=p.id==='full'||p.id==='custom';
    m.append(sectionCard((p.en||'Package')+(p.id==='custom'?' (visitor builds their own)':''),null,
      langPair('Name',p,'en','ar'),h('div',{style:'height:12px'}),langPair('Description',p,'den','dar',true),
      p.id==='custom'?null:h('div',{style:'margin-top:14px'},h('p',{class:'lang-l',text:'Included services'}),chips),
      h('div',{class:'row',style:'margin-top:14px'},
        h('button',{class:'btn sm',type:'button',disabled:i===0||null,text:'Move up',onclick:()=>{move(c.packages,i,-1);touch();render()}}),
        h('button',{class:'btn sm',type:'button',disabled:i===c.packages.length-1||null,text:'Move down',onclick:()=>{move(c.packages,i,1);touch();render()}}),
        prot?h('span',{class:'note',text:'This package is required and cannot be deleted.'}):h('button',{class:'btn sm danger',type:'button',text:'Delete',onclick:()=>{if(confirm('Delete this package?')){c.packages.splice(i,1);touch();render()}}}))))});
  m.append(h('button',{class:'btn',type:'button',text:'+ Add package',onclick:()=>{c.packages.splice(c.packages.length-1,0,{id:'pkg-'+Date.now().toString(36),en:'New package',ar:'باقة جديدة',inc:[],den:'',dar:''});touch();render()}}))};
function move(a,i,d){const j=i+d;if(j<0||j>=a.length)return;const t=a[i];a[i]=a[j];a[j]=t}

P.services=function(m){
  const c=S.content;m.append(h('h2',{text:'Services'}),h('p',{class:'sub',text:'The six services and the “refine” options visitors can tick inside each one.'}));
  c.divisions.forEach(d=>{
    const box=h('div');
    const draw=()=>{box.textContent='';d.subs.forEach((s,i)=>{
      const e=h('input',{value:s.en,placeholder:'English'}),a=h('input',{value:s.ar,class:'ar',dir:'rtl',placeholder:'العربية'});
      e.addEventListener('input',()=>{s.en=e.value;touch()});a.addEventListener('input',()=>{s.ar=a.value;touch()});
      box.append(h('div',{class:'sub-row'},e,a,h('button',{class:'btn sm danger',type:'button',text:'Remove',onclick:()=>{d.subs.splice(i,1);touch();draw()}})))});
      box.append(h('button',{class:'btn sm',type:'button',text:'+ Add option',onclick:()=>{d.subs.push({en:'',ar:''});touch();draw()}}))};draw();
    m.append(sectionCard(d.en,null,langPair('Service name',d,'en','ar'),h('p',{class:'lang-l',style:'margin-top:16px',text:'Refine options'}),box))})};

P.booths=function(m){
  const c=S.content;m.append(h('h2',{text:'Booths'}),h('p',{class:'sub',text:'The booth cards shown when visitors open Production in “Our work”. Each has a picture and full drawing sheets.'}));
  c.booths.forEach((b,i)=>{
    const inc=h('div'),sheets=h('div',{class:'sheets'}),img=h('img',{class:'thumb'+(b.fit?' fit':''),src:srcFor(b.img),alt:''});
    const drawInc=()=>{inc.textContent='';b.inc.forEach((x,k)=>{const e=h('input',{value:x.en,placeholder:'English'}),a=h('input',{value:x.ar,class:'ar',dir:'rtl',placeholder:'العربية'});
      e.addEventListener('input',()=>{x.en=e.value;touch()});a.addEventListener('input',()=>{x.ar=a.value;touch()});
      inc.append(h('div',{class:'sub-row'},e,a,h('button',{class:'btn sm danger',type:'button',text:'Remove',onclick:()=>{b.inc.splice(k,1);touch();drawInc()}})))});
      inc.append(h('button',{class:'btn sm',type:'button',text:'+ Add line',onclick:()=>{b.inc.push({en:'',ar:''});touch();drawInc()}}))};drawInc();
    const drawSheets=()=>{sheets.textContent='';b.sheets.forEach((p,k)=>sheets.append(h('figure',{},h('img',{src:srcFor(p),alt:''}),h('button',{class:'btn sm danger',type:'button',text:'Remove',onclick:()=>{b.sheets.splice(k,1);touch();drawSheets()}}))))};drawSheets();
    const up=(label,cb,max)=>{const f=h('input',{type:'file',accept:'image/*'});f.addEventListener('change',async()=>{try{const p=await addImage(f.files[0],b.id+'-'+label,max);if(p)cb(p)}catch(e){toast('Could not read that image.',true)}f.value=''});return h('label',{},label==='card'?'Replace card picture':'Add a drawing sheet',f)};
    m.append(sectionCard(b.en||'Booth',null,
      h('div',{class:'grid2'},h('div',{},img,h('div',{style:'height:10px'}),up('card',p=>{b.img=p;img.src=srcFor(p)},1400)),h('div',{},langPair('Title',b,'en','ar'),h('div',{style:'height:12px'}),langPair('Size line',b,'sizeEn','sizeAr'))),
      h('p',{class:'lang-l',style:'margin-top:18px',text:'Inclusions'}),inc,
      h('p',{class:'lang-l',style:'margin-top:18px',text:'Drawing sheets (opened with “View drawings”)'}),sheets,h('div',{style:'height:10px'}),up('sheet',p=>{b.sheets.push(p);drawSheets()},2000),
      h('div',{class:'row',style:'margin-top:16px'},
        h('button',{class:'btn sm',type:'button',disabled:i===0||null,text:'Move up',onclick:()=>{move(c.booths,i,-1);touch();render()}}),
        h('button',{class:'btn sm',type:'button',disabled:i===c.booths.length-1||null,text:'Move down',onclick:()=>{move(c.booths,i,1);touch();render()}}),
        h('button',{class:'btn sm danger',type:'button',text:'Delete booth',onclick:()=>{if(confirm('Delete this booth card?')){c.booths.splice(i,1);touch();render()}}}))))});
  m.append(h('button',{class:'btn',type:'button',text:'+ Add booth',onclick:()=>{c.booths.push({id:'booth-'+Date.now().toString(36),img:'assets/img/booths/b18.webp',fit:false,sheets:[],sizeEn:'',sizeAr:'',en:'New booth',ar:'جناح جديد',inc:[]});touch();render()}}),
    h('p',{class:'note',style:'margin-top:10px',text:'A new booth starts with a placeholder picture. Replace it, then add its drawing sheets.'}))};

P.photos=function(m){
  const c=S.content;m.append(h('h2',{text:'Photos'}),h('p',{class:'sub',text:'The six photos in the “What’s inside” slideshow and the “Our work” grid. Images are resized and compressed automatically.'}));
  c.photos.forEach((p,i)=>{const img=h('img',{class:'thumb',src:srcFor(p.src),alt:''});
    const f=h('input',{type:'file',accept:'image/*'});f.addEventListener('change',async()=>{try{const path=await addImage(f.files[0],'photo-'+(i+1),1600);if(path){p.src=path;img.src=srcFor(path)}}catch(e){toast('Could not read that image.',true)}f.value=''});
    m.append(sectionCard((i+1)+'. '+p.en,null,h('div',{class:'grid2'},h('div',{},img,h('div',{style:'height:10px'}),h('label',{},'Replace photo',f)),langPair('Caption',p,'en','ar'))))});
  m.append(h('p',{class:'note',text:'Only upload photos you own or have permission to use.'}))};

P.files=function(m){
  const F=S.content.files;m.append(h('h2',{text:'Company profile'}),h('p',{class:'sub',text:'The PDFs visitors download. English visitors get the English file, Arabic visitors get the Arabic one. Uploads are saved as new dated files, so the old ones are kept.'}));
  [['profileEn','English profile (PDF)','LAFTAH-Experiences-Company-Profile-EN'],['profileAr','Arabic profile (PDF)','LAFTAH-Experiences-Company-Profile-AR']].forEach(([k,l,base])=>{
    const cur=h('p',{class:'note'});const set=()=>{cur.textContent='Current file: '+F[k]+(S.files.has(F[k])?'  (not published yet)':'')};set();
    const f=h('input',{type:'file',accept:'application/pdf'});f.addEventListener('change',async()=>{const p=await addPdf(f.files[0],base);if(p){F[k]=p;set();toast('PDF added to the draft.')}f.value=''});
    m.append(sectionCard(l,null,cur,h('label',{},'Upload a new PDF',f)))})};

/* ---------- publish ---------- */
function changes(){const c=S.content,o=JSON.parse(S.orig),out=[];
  const same=k=>JSON.stringify(c[k])===JSON.stringify(o[k]);
  if(!same('settings'))out.push('Settings changed');
  const tk=Object.keys(c.text).filter(k=>JSON.stringify(c.text[k])!==JSON.stringify((o.text||{})[k])).concat(Object.keys(o.text||{}).filter(k=>!c.text[k]));
  if(tk.length)out.push(`${tk.length} text block${tk.length>1?'s':''} edited`);
  [['packages','Packages'],['divisions','Services'],['booths','Booths'],['photos','Photos'],['files','Company profile']].forEach(([k,l])=>{if(!same(k))out.push(l+' changed')});
  const up=[...S.files.entries()].filter(([p,f])=>f.pending&&used(p));
  if(up.length)out.push(`${up.length} new file${up.length>1?'s':''} to upload`);return out}
function used(p){return JSON.stringify(S.content).includes('"'+p+'"')}
P.publish=function(m){
  const ch=changes();if(S.justPublished){S.justPublished=false;m.append(h('div',{class:'card'},h('h3',{text:'Published'}),h('p',{class:'ok',text:'Your changes were saved. The live site updates in about one to two minutes — hard-refresh the page to see them.'})))}m.append(h('h2',{text:'Publish'}),h('p',{class:'sub',text:'Publishing saves your draft to the website. The live site updates about one to two minutes later.'}));
  const msg=h('input',{value:'Update website content',placeholder:'Short note about this update'});
  const prog=h('div',{class:'prog',hidden:true},h('i')),status=h('p',{class:'note'});
  const btn=h('button',{class:'btn primary',type:'button',text:'Publish now',disabled:!ch.length||null});
  btn.addEventListener('click',async()=>{btn.disabled=true;prog.hidden=false;try{await publish(msg.value||'Update website content',pct=>{prog.firstChild.style.width=pct+'%';status.textContent='Publishing… '+pct+'%'});
      S.justPublished=true;toast('Published');render()}catch(e){btn.disabled=false;status.textContent='';toast(e.message||'Publish failed',true)}});
  m.append(sectionCard('Changes in this draft',null,ch.length?h('ul',{class:'list'},...ch.map(x=>h('li',{text:x}))):h('p',{class:'ok',text:'Nothing to publish. Everything is already live.'})),
    ch.length?sectionCard('Publish',null,h('label',{},'Update note',msg),h('div',{style:'height:14px'}),h('div',{class:'row'},btn,h('button',{class:'btn',type:'button',onclick:preview,text:'Preview first'})),prog,status):null,
    ch.length?h('button',{class:'btn sm danger',type:'button',text:'Discard all draft changes',onclick:()=>{if(confirm('Discard every unpublished change on this device?')){S.content=JSON.parse(S.orig);S.files.clear();touch();render()}}}):null)};
async function publish(message,prog){
  if(!isDirty())throw new Error('Nothing to publish.');
  const cur=await gh(`repos/${S.repo}/contents/content/content.js?ref=${encodeURIComponent(S.branch)}`);
  if(cur.sha!==S.origSha)throw new Error('The site was changed somewhere else. Reload this page and re-apply your edits.');
  const ref=await gh(`repos/${S.repo}/git/ref/heads/${encodeURIComponent(S.branch)}`),head=ref.object.sha;
  const commit=await gh(`repos/${S.repo}/git/commits/${head}`);prog(10);
  const items=[],files=[...S.files.entries()].filter(([p,f])=>f.pending&&used(p));
  let n=0;const total=files.length+1;
  for(const [p,f] of files){
    let data;if(f.blob)data=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(f.blob)});else if(f.dataUrl)data=f.dataUrl.split(',')[1];else continue;
    const bl=await gh(`repos/${S.repo}/git/blobs`,{method:'POST',body:{content:data,encoding:'base64'}});items.push({path:p,mode:'100644',type:'blob',sha:bl.sha});prog(10+Math.round(70*(++n)/total))}
  const cb=await gh(`repos/${S.repo}/git/blobs`,{method:'POST',body:{content:serialize(S.content),encoding:'utf-8'}});
  items.push({path:'content/content.js',mode:'100644',type:'blob',sha:cb.sha});prog(85);
  const tree=await gh(`repos/${S.repo}/git/trees`,{method:'POST',body:{base_tree:commit.tree.sha,tree:items}});
  const nc=await gh(`repos/${S.repo}/git/commits`,{method:'POST',body:{message:message+'\n\nPublished from the LAFTAH admin.',tree:tree.sha,parents:[head]}});
  await gh(`repos/${S.repo}/git/refs/heads/${encodeURIComponent(S.branch)}`,{method:'PATCH',body:{sha:nc.sha}});prog(100);
  S.orig=JSON.stringify(S.content);const f=await gh(`repos/${S.repo}/contents/content/content.js?ref=${encodeURIComponent(S.branch)}`);S.origSha=f.sha;
  S.files.forEach(v=>v.pending=false);S.last={date:new Date().toISOString(),msg:message};
  localStorage.removeItem('laftah_draft');localStorage.removeItem('laftah_draft_files');$('#dirtyDot').hidden=true}

/* ---------- shell ---------- */
function preview(){try{localStorage.setItem('laftah_draft',JSON.stringify(S.content));const fl={};S.files.forEach((v,p)=>{if(v.pending&&v.dataUrl&&v.image)fl[p]=v.dataUrl});localStorage.setItem('laftah_draft_files',JSON.stringify(fl))}catch(e){toast('Could not save the draft for preview (storage full).',true);return}
  window.open('../index.html?preview=1','_blank')}
function go(p){location.hash='#/'+p}
function render(){const p=(location.hash.replace('#/','')||'dashboard');const page=P[p]?p:'dashboard';
  $('#nav').querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.p===page));
  const m=$('#main');m.textContent='';P[page](m);$('#dirtyDot').hidden=!isDirty();window.scrollTo(0,0)}
function boot(){$('#gate').hidden=true;$('#app').hidden=false;
  const nav=$('#nav');nav.textContent='';PAGES.forEach(([k,l])=>nav.append(h('a',{href:'#/'+k,'data-p':k,text:l})));
  addEventListener('hashchange',render);$('#btnPublish').onclick=()=>go('publish');$('#btnPreview').onclick=preview;
  $('#btnOut').onclick=()=>{if(isDirty()&&!confirm('You have unpublished changes. Sign out anyway? Your draft stays on this device.'))return;localStorage.removeItem('laftah_admin_token');sessionStorage.removeItem('laftah_admin_token');location.reload()};
  addEventListener('beforeunload',e=>{if(isDirty()){e.preventDefault();e.returnValue=''}});render()}
async function signIn(repo,branch,token,remember){S.repo=repo.trim();S.branch=branch.trim()||'main';S.token=token.trim();
  await gh('user');await gh(`repos/${S.repo}`);await loadAll();
  const st=remember?localStorage:sessionStorage;st.setItem('laftah_admin_token',JSON.stringify({repo:S.repo,branch:S.branch,token:S.token}));boot()}
$('#gateForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('#gBtn'),er=$('#gErr');er.textContent='';b.disabled=true;b.textContent='Signing in…';
  try{await signIn($('#gRepo').value,$('#gBranch').value,$('#gToken').value,$('#gRemember').checked)}
  catch(x){er.textContent=x.status===401?'That token was not accepted.':x.status===404?'Repository or file not found. Check the repository name and that the token has access to it.':(x.message||'Could not sign in.')}
  b.disabled=false;b.textContent='Sign in'});
(async function(){const sv=localStorage.getItem('laftah_admin_token')||sessionStorage.getItem('laftah_admin_token');if(!sv)return;
  try{const o=JSON.parse(sv);await signIn(o.repo,o.branch,o.token,!!localStorage.getItem('laftah_admin_token'))}catch(e){$('#gErr').textContent='Please sign in again.'}})();
})();
