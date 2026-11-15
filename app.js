'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P={home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',compass:'<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',check:'<path d="M20 6 9 17l-5-5"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3 0 1.4 1 2.5 2.5 2.5z"/>',box:'<path d="m7.5 4.3 9 5.2"/><path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'};
const ic=(n,s=18)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

/* ---------- storage (IndexedDB, saved in the visitor's browser) ---------- */
const db=new Promise((ok,no)=>{const r=indexedDB.open('mod-horizon',1);r.onupgradeneeded=()=>{r.result.createObjectStore('users',{keyPath:'name'});r.result.createObjectStore('mods',{keyPath:'uid'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=async(st,mode,fn)=>{const d=await db;return new Promise((ok,no)=>{const t=d.transaction(st,mode);const q=fn(t.objectStore(st));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
const getAll=s=>tx(s,'readonly',o=>o.getAll()),get=(s,k)=>tx(s,'readonly',o=>o.get(k)),put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
const me=()=>localStorage.getItem('mh_user');
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('mh:'+t)))].map(b=>b.toString(16).padStart(2,'0')).join('');

/* ---------- config ---------- */
const MAX=64*1024*1024;
const KINDS={hmod:{l:'Mod (.hmod)',e:['.hmod']},hnmod:{l:'Native mod (.hnmod)',e:['.hnmod']},hpack:{l:'Modpack (.hpack)',e:['.hpack']},hshader:{l:'Shader pack (.hshader or .zip)',e:['.hshader','.zip'],z:'shader'},resource:{l:'Resource pack (.zip)',e:['.zip'],z:'resource'},data:{l:'Data pack (.zip)',e:['.zip'],z:'data'}};
const CATS=['Optimization','Utility','Game mechanics','Adventure','Decoration','Library','Magic','Technology','World generation','Cosmetic','Equipment','Storage'];
const LICS=['MIT','Apache-2.0','GPL-3.0','LGPL-3.0','BSD-3-Clause','MPL-2.0','CC0-1.0','All Rights Reserved'];
const ext=n=>(n.match(/\.[^.]+$/)||[''])[0].toLowerCase();
const size=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.ceil(b/1024)+' KB';

/* ---------- helpers ---------- */
const readURL=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
const dims=url=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok([i.naturalWidth,i.naturalHeight]);i.onerror=()=>no();i.src=url});
const BLANK='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0e1b27"/><path d="M14 40a18 18 0 0 1 36 0z" fill="#f5a524"/></svg>');
function md(t){const L=String(t||'').split('\n');let h='',list=null;const end=()=>{if(list){h+=`</${list}>`;list=null}};
 for(let l of L){l=l.trim();let m;
  if(!l){end();continue}
  if(m=l.match(/^(#{1,3})\s+(.*)/)){end();h+=`<h3>${esc(m[2])}</h3>`}
  else if(m=l.match(/^[-*]\s+(.*)/)){if(list!=='ul'){end();h+='<ul>';list='ul'}h+=`<li>${esc(m[1])}</li>`}
  else if(m=l.match(/^\d+\.\s+(.*)/)){if(list!=='ol'){end();h+='<ol>';list='ol'}h+=`<li>${esc(m[1])}</li>`}
  else{end();h+=`<p>${esc(l)}</p>`}}
 end();return h}
function download(m){const a=document.createElement('a');const u=URL.createObjectURL(m.file);a.href=u;a.download=`${m.modId}-${m.version}${ext(m.fileName)}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);m.downloads=(m.downloads||0)+1;put('mods',m)}
const A=$('#app');
const go=h=>{location.hash=h};

/* ---------- nav ---------- */
function nav(r){const u=me();const t=[['home','home','Home','#/home'],['discovery','compass','Discovery','#/discovery'],['post','upload','Post','#/post'],u?['profile','user','Profile','#/profile']:['login','user','Log in','#/login']];
 $('#nav').innerHTML=t.map(([k,i,l,h])=>`<a href="${h}" class="${r===k?'on':''}" ${r===k?'aria-current="page"':''}>${ic(i)}<span>${l}</span></a>`).join('')}

/* ---------- cards ---------- */
function card(m){const img=m.icon||BLANK;return `<article class="card" data-id="${m.uid}" tabindex="0" role="link" aria-label="${esc(m.name)}">
<div class="row"><img class="icon" src="${img}" alt=""><div><h3>${esc(m.name)}</h3><div class="meta">Version: ${esc(m.version)}<br>Author: ${esc(m.authors)}</div></div></div>
<p class="sum">${esc(m.summary)}</p>
<div class="foot"><span class="badge">${ic('check',12)}PUBLISHED</span><button class="btn sm" data-dl="${m.uid}">${ic('download',16)}DOWNLOAD</button></div></article>`}
function wire(list){A.querySelectorAll('.card').forEach(c=>{const o=()=>go('#/mod/'+c.dataset.id);c.onclick=e=>{if(!e.target.closest('[data-dl]'))o()};c.onkeydown=e=>{if(e.key==='Enter')o()}});
 A.querySelectorAll('[data-dl]').forEach(b=>b.onclick=e=>{e.stopPropagation();download(list.find(x=>x.uid===b.dataset.dl))})}

/* ---------- pages ---------- */
async function home(){const all=(await getAll('mods')).sort((a,b)=>b.created-a.created);
 A.innerHTML=`<section class="hero"><h1>Official Mod Horizon</h1><p class="lead">Scroll to find mods, modpacks, shaders and packs for Horizon, or search for one.</p>
 <div class="bar"><div class="s">${ic('search')}<input id="q" type="search" placeholder="Search mods, authors, tags" aria-label="Search"></div>
 <select id="k" aria-label="Kind"><option value="">All kinds</option>${Object.entries(KINDS).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}</select></div></section><div id="list"></div>`;
 const draw=()=>{const q=$('#q').value.toLowerCase(),k=$('#k').value;const f=all.filter(m=>(!k||m.kind===k)&&(!q||[m.name,m.summary,m.authors,m.modId,(m.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)));
  $('#list').innerHTML=f.length?`<div class="grid">${f.map(card).join('')}</div>`:`<div class="empty"><p>${all.length?'Nothing matches that search.':'No mods published yet.'}</p><a class="btn" href="#/post">${ic('upload')}Post the first mod</a></div>`;wire(f)};
 $('#q').oninput=draw;$('#k').onchange=draw;draw()}

async function discovery(){const all=await getAll('mods');const now=Date.now();
 const score=m=>(m.downloads||0)*3+Math.max(0,10-(now-m.created)/864e5);
 const tr=[...all].sort((a,b)=>score(b)-score(a)).slice(0,12);const nw=[...all].sort((a,b)=>b.created-a.created).slice(0,6);
 A.innerHTML=`<h1>${ic('flame',32)} Discovery</h1><p class="lead">Trending mods, ranked by downloads and freshness.</p>`+(all.length?`<h2>Trending</h2><div class="grid">${tr.map(card).join('')}</div><h2>Newest</h2><div class="grid">${nw.map(card).join('')}</div>`:`<div class="empty"><p>Nothing is trending yet.</p><a class="btn" href="#/post">${ic('upload')}Post a mod</a></div>`);
 wire(all)}

async function detail(id){const m=await get('mods',id);if(!m){A.innerHTML='<div class="empty"><p>This mod was not found.</p><a class="btn" href="#/home">Back to Home</a></div>';return}
 A.innerHTML=`<div class="row" style="align-items:flex-start;flex-wrap:wrap"><img class="icon" style="width:96px;height:96px" src="${m.icon||BLANK}" alt=""><div style="flex:1 1 240px"><h1>${esc(m.name)}</h1><div class="meta">By ${esc(m.authors)} · v${esc(m.version)} · Minecraft ${esc(m.mc)} · ${esc(KINDS[m.kind].l)}</div><p>${esc(m.summary)}</p><span class="badge">${ic('check',12)}PUBLISHED</span></div>
 <button class="btn" id="d">${ic('download')}DOWNLOAD (${size(m.file.size)})</button></div>
 ${m.shots?.length?`<h2>Screenshots</h2><div class="shots">${m.shots.map(s=>`<img src="${s}" alt="Screenshot of ${esc(m.name)}">`).join('')}</div>`:''}
 <h2>Description</h2><div class="desc">${md(m.description)||'<p>No description.</p>'}</div>
 <h2>Details</h2><p class="meta">Id: ${esc(m.modId)} · Licence: ${esc(m.license)} · Downloads: <span id="dc">${m.downloads||0}</span></p>
 <p>${(m.cats||[]).map(c=>`<span class="tag">${esc(c)}</span>`).join('')}${(m.tags||[]).map(c=>`<span class="tag">#${esc(c)}</span>`).join('')}</p>
 ${/^https?:\/\//.test(m.source||'')?`<p>Source: <a href="${esc(m.source)}" rel="noopener noreferrer" target="_blank">${esc(m.source)}</a></p>`:''}
 <h2>What changed</h2><div class="desc">${md(m.changelog)}</div>`;
 $('#d').onclick=()=>{download(m);$('#dc').textContent=m.downloads}}

function postForm(){
 if(!me()){A.innerHTML=`<div class="empty"><h1>Account required</h1><p>Log in or create an account to post a mod.</p><a class="btn" href="#/login">Log in or sign up</a></div>`;return}
 const opt=a=>a.map(x=>`<option>${x}</option>`).join('');
 A.innerHTML=`<h1>Post a mod</h1><p class="lead">Your listing goes live on Home as soon as you post. There is no review step.</p>
 <form id="f" novalidate>
 <fieldset><legend>1. The file</legend>
 <label for="kind">Kind</label><select id="kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}</select>
 <label for="file">File</label><input id="file" type="file"><p class="hint">Upload your project file here. Maximum size: 64 MB.</p>
 <div class="two"><div><label for="id">Id</label><input id="id" placeholder="my_mod"><p class="hint">Lowercase letters, numbers and underscores.</p></div><div><label for="ver">Version</label><input id="ver" value="1.0.0"></div></div>
 <label for="mc">For Minecraft</label><input id="mc" value="26.3">
 <label for="log">What changed</label><textarea id="log" placeholder="Initial release.&#10;&#10;- Added new features.&#10;- Improved performance.&#10;- Fixed known issues."></textarea></fieldset>
 <fieldset><legend>2. Its page</legend>
 <div class="two"><div><label for="name">Name</label><input id="name" placeholder="My Mod"></div><div><label for="lic">Licence</label><select id="lic">${opt(LICS)}</select></div></div>
 <label for="sum">Summary</label><input id="sum" maxlength="160" placeholder="An exciting Minecraft modification with new features and optimized gameplay.">
 <label for="desc">Description <small>(use - for bullets and 1. for steps)</small></label><textarea id="desc" style="min-height:220px" placeholder="Welcome to My Mod!&#10;&#10;## Features&#10;- New gameplay features&#10;&#10;## How to Install&#10;1. Download the file.&#10;2. Open Horizon.&#10;3. Import the downloaded file."></textarea>
 <label>Categories <small>(choose 1–3)</small></label><div class="chips" id="cats">${CATS.map(c=>`<label><input type="checkbox" value="${c}">${c}</label>`).join('')}</div>
 <label for="tags">Tags <small>(optional, up to 10, comma separated)</small></label><input id="tags" placeholder="minecraft, horizon, optimization">
 <label for="au">Authors</label><input id="au" value="${esc(me())}">
 <label for="src">Source code</label><input id="src" type="url" placeholder="https://github.com/YOUR_USERNAME/YOUR_REPOSITORY">
 <label for="ico">Icon</label><input id="ico" type="file" accept="image/png"><p class="hint">PNG, square, 64 × 64 to 1024 × 1024 pixels, up to 256 KiB.</p>
 <label for="shots">Screenshots <small>(optional, up to 8)</small></label><input id="shots" type="file" accept="image/png,image/jpeg" multiple><p class="hint">PNG or JPEG, 320 × 180 to 3840 × 2160 pixels, up to 1 MiB each.</p></fieldset>
 <fieldset><legend>3. Agreement</legend>
 ${['I made it, or I may publish it under this licence.','Its source is at the address above.','I accept the mod policy.','I am responsible for this project.'].map(t=>`<label class="chk"><input type="checkbox" class="ag">${t}</label>`).join('')}</fieldset>
 <div id="e"></div><button class="btn" id="go" type="submit">${ic('upload')}POST</button></form>`;
 $('#f').onsubmit=async e=>{e.preventDefault();const b=$('#go'),E=$('#e');const er=[];E.innerHTML='';b.disabled=true;b.textContent='Validating…';
  try{
   const kind=KINDS[$('#kind').value],file=$('#file').files[0],v=id=>$('#'+id).value.trim();
   /* 1. validate uploaded file */
   if(!file)er.push('Choose a file to upload.');
   else{if(!kind.e.includes(ext(file.name)))er.push(`${kind.l} must use ${kind.e.join(' or ')}. You chose ${ext(file.name)||'a file with no extension'}.`);
    if(file.size>MAX)er.push(`The file is ${size(file.size)}. The limit is 64 MB.`);
    if(kind.z&&ext(file.name)==='.zip'&&window.JSZip&&!er.length){try{const z=await JSZip.loadAsync(file);const n=Object.keys(z.files);const has=p=>n.some(x=>x.startsWith(p));
      if(kind.z==='data'&&!(n.includes('pack.mcmeta')&&has('data/')))er.push('A data pack needs pack.mcmeta and a data/ folder at the top level of the ZIP.');
      if(kind.z==='resource'&&!(n.includes('pack.mcmeta')&&has('assets/')))er.push('A resource pack needs pack.mcmeta and an assets/ folder at the top level of the ZIP.');
      if(kind.z==='shader'&&!has('shaders/'))er.push('A shader pack ZIP needs a shaders/ folder at the top level.')}catch{er.push('This ZIP could not be read. Re-export it and try again.')}}}
   /* 2. validate required information */
   const id=v('id'),ver=v('ver'),name=v('name'),sum=v('sum'),au=v('au'),src=v('src');
   if(!/^[a-z0-9_]{2,64}$/.test(id))er.push('Id must be 2–64 characters: lowercase letters, numbers and underscores.');
   if(!ver)er.push('Enter a version.');if(!v('mc'))er.push('Enter the Minecraft version.');if(!v('log'))er.push('Describe what changed.');
   if(!name)er.push('Enter a name.');if(!sum)er.push('Enter a summary.');if(!v('desc'))er.push('Enter a description.');if(!au)er.push('Enter at least one author.');
   if(!/^https?:\/\/.+/.test(src))er.push('Source code must be a web address starting with https://');
   const cats=[...document.querySelectorAll('#cats input:checked')].map(x=>x.value);if(cats.length<1||cats.length>3)er.push('Choose 1 to 3 categories.');
   const tags=v('tags').split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);if(tags.length>10)er.push('Use at most 10 tags.');
   const ex=(await getAll('mods')).find(m=>m.modId===id&&m.version===ver);if(ex)er.push(`${id} ${ver} is already published. Use a new version number.`);
   let icon='',shots=[];const ic0=$('#ico').files[0];
   if(!ic0)er.push('Upload an icon.');else{try{if(ic0.type!=='image/png')throw'Icon must be a PNG.';if(ic0.size>262144)throw`Icon is ${size(ic0.size)}. The limit is 256 KiB.`;const u=await readURL(ic0),[w,h]=await dims(u);if(w!==h)throw'Icon must be square.';if(w<64||w>1024)throw'Icon must be between 64 and 1024 pixels.';icon=u}catch(x){er.push(typeof x==='string'?x:'The icon could not be read.')}}
   const sf=[...$('#shots').files];if(sf.length>8)er.push('Use at most 8 screenshots.');
   else for(const s of sf){try{if(!/^image\/(png|jpeg)$/.test(s.type))throw`${s.name} must be PNG or JPEG.`;if(s.size>1048576)throw`${s.name} is ${size(s.size)}. The limit is 1 MiB.`;const u=await readURL(s),[w,h]=await dims(u);if(w<320||h<180||w>3840||h>2160)throw`${s.name} must be between 320 × 180 and 3840 × 2160 pixels.`;shots.push(u)}catch(x){er.push(typeof x==='string'?x:`${s.name} could not be read.`)}}
   if([...document.querySelectorAll('.ag')].some(c=>!c.checked))er.push('Tick all four agreement boxes.');
   if(er.length){E.innerHTML=`<div class="err" role="alert"><b>Fix these to post:</b><ul>${er.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;E.scrollIntoView({block:'center'});return}
   /* 3-6. upload, publish, add to Home, enable download */
   b.textContent='Publishing…';
   const m={uid:crypto.randomUUID(),modId:id,kind:$('#kind').value,version:ver,mc:v('mc'),changelog:v('log'),name,license:$('#lic').value,summary:sum,description:v('desc'),cats,tags,authors:au,source:src,icon,shots,file,fileName:file.name,owner:me(),created:Date.now(),downloads:0,status:'PUBLISHED'};
   await put('mods',m);done(m);
  }catch(x){E.innerHTML=`<div class="err" role="alert">Could not publish: ${esc(x.message||x)}. Your browser may be out of storage.</div>`}
  finally{b.disabled=false;b.innerHTML=`${ic('upload')}POST`}}}
function done(m){A.innerHTML=`<div class="done"><span class="badge">Status: PUBLISHED</span><h1 style="margin-top:14px">Your mod has been successfully published!</h1><p class="lead" style="margin-inline:auto">${esc(m.name)} ${esc(m.version)} is live on Home and ready to download.</p>
 <p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="#/home">VIEW ON HOME</a><button class="btn ghost" id="d">${ic('download')}DOWNLOAD</button></p></div>`;$('#d').onclick=()=>download(m);scrollTo(0,0)}

function login(){if(me())return go('#/profile');let up=false;
 const draw=()=>{A.innerHTML=`<form class="auth" id="a"><h1>${up?'Create account':'Log in'}</h1><p class="lead">${up?'Accounts let you post mods and keep a profile.':'Log in to post mods and see your profile.'}</p>
 <label for="u">Username</label><input id="u" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+"><label for="p">Password</label><input id="p" type="password" autocomplete="${up?'new-password':'current-password'}" required minlength="6">
 <div id="e"></div><p><button class="btn" style="width:100%">${up?'Create account':'Log in'}</button></p><p class="meta"><a href="#" id="t">${up?'I already have an account':'Create a new account'}</a></p></form>`;
  $('#t').onclick=e=>{e.preventDefault();up=!up;draw()};
  $('#a').onsubmit=async e=>{e.preventDefault();const n=$('#u').value.trim(),p=$('#p').value,E=$('#e');const bad=t=>E.innerHTML=`<div class="err" role="alert">${t}</div>`;
   if(!/^[A-Za-z0-9_]{3,24}$/.test(n))return bad('Username: 3–24 letters, numbers or underscores.');if(p.length<6)return bad('Password needs at least 6 characters.');
   const k=n.toLowerCase(),u=await get('users',k),h=await sha(p);
   if(up){if(u)return bad('That username is taken.');await put('users',{name:k,display:n,hash:h,created:Date.now()})}
   else if(!u||u.hash!==h)return bad('Wrong username or password.');
   localStorage.setItem('mh_user',(u&&u.display)||n);go('#/profile')}};draw()}

async function profile(){const n=me();if(!n)return go('#/login');const mine=(await getAll('mods')).filter(m=>m.owner===n).sort((a,b)=>b.created-a.created);
 A.innerHTML=`<div class="row" style="justify-content:space-between;flex-wrap:wrap"><div><h1>${ic('user',32)} ${esc(n)}</h1><p class="lead" style="margin:0">${mine.length} published · ${mine.reduce((s,m)=>s+(m.downloads||0),0)} downloads</p></div><button class="btn ghost" id="lo">${ic('logout')}Log out</button></div>
 <h2>Your mods</h2>${mine.length?`<div class="grid">${mine.map(m=>card(m).replace('</article>',`<button class="btn danger sm" data-rm="${m.uid}">${ic('trash',16)}Delete</button></article>`)).join('')}</div>`:`<div class="empty"><p>You have not posted anything yet.</p><a class="btn" href="#/post">${ic('upload')}Post a mod</a></div>`}`;
 $('#lo').onclick=()=>{localStorage.removeItem('mh_user');go('#/home')};wire(mine);
 A.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async e=>{e.stopPropagation();if(confirm('Delete this mod? This cannot be undone.')){await del('mods',b.dataset.rm);profile()}})}

/* ---------- router ---------- */
async function route(){const h=location.hash.replace(/^#\/?/,'')||'home';const [r,a]=h.split('/');
 nav(r==='mod'?'home':r);scrollTo(0,0);
 try{({home,discovery,post:postForm,login,profile,mod:()=>detail(a)}[r]||home)()}catch(e){A.innerHTML='<div class="err">Something went wrong loading this page. Reload and try again.</div>'}}
addEventListener('hashchange',route);route();
