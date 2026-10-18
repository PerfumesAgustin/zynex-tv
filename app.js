'use strict';
const KEY='zynex-catalog-v11',FEED='zynex-feed-v11',SETTINGS='zynex-v2-settings',DEVICE='zynex-v2-device';
const ACTIVATION_URL='https://script.google.com/macros/s/AKfycbzW5e-ML0blgH5qwffYGlB_ViLYmoOu00UydhAQu5ZkZkXulaGHEzBgyHg3DkdU5jUbHQ/exec';
const DEFAULT_FEED='https://script.google.com/macros/s/AKfycbxPRRRZf33fuoCGvMEtUx3dsWzcyjH6QLwzoKNdaZz81m923HRrXKNz5ynglPswDQn1bQ/exec';
const $=id=>document.getElementById(id);
const seed=[{id:'1aGilnegIpduoL5RXAAC9jfwxm4FvrQca',title:'Argentina.1985',category:'ZINEX',description:'',cover:'',link:'https://drive.google.com/file/d/1aGilnegIpduoL5RXAAC9jfwxm4FvrQca/view'}];
function driveId(x){const s=String(x||'');return (s.match(/\/file\/d\/([\w-]+)/)||s.match(/[?&]id=([\w-]+)/)||[])[1]||''}
function clean(x){if(!x||typeof x!=='object')return null;const id=driveId(x.link)||String(x.id||'').replace(/[^\w-]/g,'');if(!id)return null;return {id,title:String(x.title||x.name||'Sin título').slice(0,140),category:String(x.category||'General').slice(0,80),description:String(x.description||'').slice(0,800),cover:/^https:\/\//i.test(x.cover||'')?String(x.cover):'',link:'https://drive.google.com/file/d/'+id+'/view'}}
function readJSON(key,fallback){try{const a=JSON.parse(localStorage.getItem(key));return a??fallback}catch{return fallback}}
function initialDocs(){const a=readJSON(KEY,null);return Array.isArray(a)?a.map(clean).filter(Boolean):seed.map(x=>({...x}))}
let docs=initialDocs(),settings=readJSON(SETTINGS,{autoSync:true}),selected=null,focusBefore=null,deviceCode=localStorage.getItem(DEVICE)||'',deviceApproved=false,feedMode='separate',authorizationBusy=false;
const getFeed=()=>($('feedInput').value||'').trim();
function persist(){localStorage.setItem(KEY,JSON.stringify(docs));render()}
function feedback(message){$('feedback').textContent=message}
function background(d){const cover=d?.cover||(d?.id?localStorage.getItem('zynex-cover-'+d.id):'');return cover?'linear-gradient(0deg,#06102277,#06102233),url("'+encodeURI(cover).replace(/"/g,'%22')+'")':''}
function render(){const query=$('search').value.trim().toLocaleLowerCase(),filter=$('filter').value;const cats=[...new Set(docs.map(d=>d.category))].sort();$('filter').replaceChildren(new Option('Todas las categorías',''),...cats.map(c=>new Option(c,c)));$('filter').value=cats.includes(filter)?filter:'';const found=docs.filter(d=>(!filter||d.category===filter)&&[d.title,d.category,d.description].join(' ').toLocaleLowerCase().includes(query));$('count').textContent=docs.length+' títulos';$('rows').replaceChildren();$('empty').hidden=!!found.length;
 const grouped=new Map();for(const d of found){if(!grouped.has(d.category))grouped.set(d.category,[]);grouped.get(d.category).push(d)}
 for(const [cat,items] of grouped){const shelf=document.createElement('section');shelf.className='shelf';const h=document.createElement('h3');h.textContent=cat;const grid=document.createElement('div');grid.className='shelf-grid';for(const d of items){const card=document.createElement('article');card.className='poster';const art=document.createElement('button');art.className='poster-art';art.type='button';art.setAttribute('aria-label','Ver información de '+d.title);if(background(d))art.style.backgroundImage=background(d);const playSymbol=document.createElement('span');playSymbol.textContent='▶';art.append(playSymbol);art.onclick=()=>details(d);const body=document.createElement('div');body.className='poster-body';const title=document.createElement('strong');title.textContent=d.title;const meta=document.createElement('small');meta.textContent=d.category+(d.description?' · '+d.description:'');const actions=document.createElement('div');actions.className='poster-actions';const playButton=document.createElement('button');playButton.textContent='▶ Ver';playButton.onclick=()=>play(d);const info=document.createElement('button');info.textContent='Detalles';info.onclick=()=>details(d);actions.append(playButton,info);body.append(title,meta,actions);card.append(art,body);grid.append(card)}shelf.append(h,grid);$('rows').append(shelf)}
 const hero=docs[0];$('heroTitle').textContent=hero?.title||'Historias que merecen ser vistas.';$('heroDescription').textContent=hero?.description||'Una biblioteca de documentales, organizada para disfrutar en cualquier pantalla.';if(background(hero))$('inicio').style.backgroundImage='linear-gradient(90deg,#060b17 0%,#060b17c9 50%,#060b1780),url("'+encodeURI(hero.cover||localStorage.getItem('zynex-cover-'+hero.id)).replace(/"/g,'%22')+'")';else $('inicio').style.backgroundImage='';}
function edit(d){$('editId').value=d.id;$('titleInput').value=d.title;$('categoryInput').value=d.category;$('linkInput').value=d.link;$('coverInput').value=d.cover;$('descInput').value=d.description;closeDetails();location.hash='administracion';$('titleInput').focus()}
function clearForm(){$('editor').reset();$('editId').value='';$('coverFile').value=''}
function removeDoc(d){if(confirm('¿Eliminar '+d.title+' del catálogo local?')){docs=docs.filter(x=>x.id!==d.id);persist()}}
function saveSettings(){settings.autoSync=$('autoSync').checked;localStorage.setItem(SETTINGS,JSON.stringify(settings))}
function mergeCatalog(items){let added=0,updated=0,unchanged=0;for(const item of items){const d=clean(item);if(!d)continue;const index=docs.findIndex(x=>x.id===d.id);if(index<0){docs.push(d);added++;continue}const old=docs[index];const next={...old,title:d.title,category:d.category,link:d.link,description:old.description||d.description,cover:old.cover||d.cover};if(JSON.stringify(next)!==JSON.stringify(old)){docs[index]=next;updated++}else unchanged++}persist();return {added,updated,unchanged}}
function makeDeviceCode(){
 if(deviceCode)return deviceCode;
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',values=new Uint32Array(10);
 crypto.getRandomValues(values);
 deviceCode='ZYNEX-TV-'+Array.from(values,n=>chars[n%chars.length]).join('');
 localStorage.setItem(DEVICE,deviceCode);
 return deviceCode;
}
async function request(url){
 const response=await fetch(url,{cache:'no-store',redirect:'follow'});
 if(!response.ok)throw Error('HTTP '+response.status);
 return response.json();
}
function activationUrl(accion){
 const u=new URL(ACTIVATION_URL);
 u.searchParams.set('accion',accion);
 u.searchParams.set('codigo',makeDeviceCode());
 return u.toString();
}
function lockDevice(message){
 deviceApproved=false;
 document.body.classList.add('device-locked');
 if(!$('modal').hidden)closePlayer();
 $('deviceModal').hidden=false;
 $('deviceCode').textContent=makeDeviceCode();
 $('deviceModalStatus').textContent=message;
 $('deviceStatus').textContent=message;
 $('connection').textContent='● Activación pendiente';
}
async function checkAuthorization(){
 if(authorizationBusy)return deviceApproved;
 authorizationBusy=true;
 const code=makeDeviceCode();
 $('deviceCode').textContent=code;
 try{
  let data=await request(activationUrl('consultar'));
  if(data.estado==='no_registrado')data=await request(activationUrl('registrar'));
  if(data.error||!['pendiente','aprobado','bloqueado'].includes(data.estado))
   throw Error(data.error||'Respuesta de activación inválida');
  const wasApproved=deviceApproved;
  deviceApproved=data.estado==='aprobado';
  if(deviceApproved){
   document.body.classList.remove('device-locked');
   $('deviceModal').hidden=true;
   $('deviceStatus').textContent='Dispositivo autorizado: '+code;
   $('connection').textContent='● Dispositivo autorizado';
   if(!wasApproved&&settings.autoSync!==false)syncCatalog(true);
  }else{
   lockDevice(data.estado==='bloqueado'?
    'Este dispositivo fue bloqueado. Consultá al administrador.':
    'Esperando autorización del administrador…');
  }
  return deviceApproved;
 }catch(err){
  lockDevice('No se pudo verificar la autorización. Revisá la conexión y reintentá. ('+err.message+')');
  return false;
 }finally{authorizationBusy=false}
}
async function syncCatalog(auto=false){
 if(!deviceApproved){
  feedback('Esperando autorización del dispositivo.');
  return;
 }
 const url=getFeed();
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(url)){
  feedback('Ingresá una URL /exec válida de Apps Script.');return;
 }
 localStorage.setItem(FEED,url);
 $('sync').disabled=true;
 feedback(auto?'Sincronización automática en curso…':'Consultando Google Drive…');
 try{
  const data=await request(url);
  if(!Array.isArray(data))throw Error('El catálogo no es una lista JSON');
  const n=mergeCatalog(data);
  feedback('Sincronización lista: '+n.added+' nuevos, '+n.updated+' actualizados y '+n.unchanged+' sin cambios.');
  $('connection').textContent='● Catálogo actualizado';
 }catch(err){
  feedback('Error al sincronizar: '+err.message);
  $('connection').textContent='● Error de sincronización';
  console.error('ZYNEX sincronización:',err);
 }finally{$('sync').disabled=false}
}
function details(d){selected=d;focusBefore=document.activeElement;$('detailTitle').textContent=d.title;$('detailCategory').textContent=d.category;$('detailDescription').textContent=d.description||'Sin descripción todavía.';$('detailArt').style.backgroundImage=background(d);$('detailModal').hidden=false;$('closeDetail').focus()}
function closeDetails(){$('detailModal').hidden=true;focusBefore?.focus()}
function play(d){if(!d)return;if(!deviceApproved){openDevice();return;}selected=d;focusBefore=document.activeElement;$('detailModal').hidden=true;$('playerTitle').textContent=d.title;$('videoFrame').replaceChildren();const iframe=document.createElement('iframe');iframe.src='https://drive.google.com/file/d/'+d.id+'/preview';iframe.title=d.title;iframe.allow='autoplay; fullscreen';iframe.allowFullscreen=true;$('videoFrame').append(iframe);$('external').href=d.link;$('modal').hidden=false;document.body.style.overflow='hidden';$('close').focus()}
function closePlayer(){$('modal').hidden=true;$('videoFrame').replaceChildren();document.body.style.overflow='';focusBefore?.focus()}
function openDevice(){makeDeviceCode();$('deviceCode').textContent=deviceCode;$('deviceModal').hidden=false;checkAuthorization()}
function closeDevice(){if(deviceApproved)$('deviceModal').hidden=true}
$('editor').onsubmit=async e=>{e.preventDefault();const d=clean({title:$('titleInput').value,category:$('categoryInput').value,link:$('linkInput').value,cover:$('coverInput').value,description:$('descInput').value});if(!d){feedback('Ingresá un enlace de Google Drive válido.');return}const file=$('coverFile').files[0];if(file){if(file.size>350000){feedback('La portada local debe pesar menos de 350 KB. Usá una URL HTTPS para imágenes grandes.');return}const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});try{localStorage.setItem('zynex-cover-'+d.id,data)}catch{feedback('No hay espacio para guardar la imagen local. Usá una URL HTTPS.');return}}const old=$('editId').value;docs=docs.filter(x=>x.id!==old&&x.id!==d.id);docs.push(d);persist();clearForm();feedback('Ficha guardada en este navegador.')};
$('clearForm').onclick=clearForm;$('search').oninput=render;$('filter').onchange=render;$('sync').onclick=()=>syncCatalog();$('autoSync').onchange=saveSettings;
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(docs,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='zynex-catalogo.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
$('import').onchange=async e=>{try{const file=e.target.files?.[0];if(!file)return;const items=JSON.parse(await file.text());if(!Array.isArray(items))throw Error('El JSON debe ser una lista');docs=items.map(clean).filter(Boolean);persist();feedback('Importados '+docs.length+' documentales.')}catch(err){feedback('Error: '+err.message)}e.target.value=''};
$('playHero').onclick=()=>play(docs[0]);$('heroDetails').onclick=()=>docs[0]&&details(docs[0]);$('closeDetail').onclick=closeDetails;$('detailPlay').onclick=()=>play(selected);$('detailEdit').onclick=()=>{const d=selected;closeDetails();edit(d)};$('close').onclick=closePlayer;
$('openDevice').onclick=openDevice;$('openDeviceAdmin').onclick=openDevice;$('closeDevice').onclick=closeDevice;$('checkDevice').onclick=()=>checkAuthorization();$('retryDevice').onclick=()=>checkAuthorization();$('copyDevice').onclick=()=>navigator.clipboard.writeText(makeDeviceCode()).then(()=>{$('deviceModalStatus').textContent='Código copiado.'}).catch(()=>{$('deviceModalStatus').textContent='Seleccioná y copiá el código manualmente.'});
window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'&&e.target===document.body){if(!$('modal').hidden)closePlayer();else if(!$('detailModal').hidden)closeDetails();else if(!$('deviceModal').hidden)closeDevice();return}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){const elements=[...document.querySelectorAll('a,button,input,select,textarea')].filter(el=>el.getClientRects().length&&!el.disabled);const index=elements.indexOf(document.activeElement);if(index>=0){const step=e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1;const next=elements[(index+step+elements.length)%elements.length];next?.focus();e.preventDefault()}}});
$('feedInput').value=localStorage.getItem(FEED)||DEFAULT_FEED;$('autoSync').checked=settings.autoSync!==false;render();lockDevice('Registrando dispositivo y comprobando autorización…');checkAuthorization();setInterval(checkAuthorization,15000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=2.1.0').catch(()=>{});
