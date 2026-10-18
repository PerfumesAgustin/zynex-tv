/**
 * ZYNEX v2: catálogo con autorización básica por dispositivo.
 * Pegá todo este archivo en Código.gs y volvé a implementar una NUEVA VERSIÓN.
 * Importante: NO protege los archivos de Drive compartidos públicamente.
 */
const FOLDER_ID = '1p7l5iG3qFn6KkN6GioSkZRubuPw6A9ru';
const PREFIX = 'ZYNEX_DEVICE_';
function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function normalizedCode(code) {
  const value = String(code || '').toUpperCase().trim();
  return /^[A-HJ-NP-Z2-9]{8}$/.test(value) ? value : '';
}
function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || 'catalog';
  const code = normalizedCode(p.device);
  if (action === 'status') {
    return output({version:2, approved:!!code && PropertiesService.getScriptProperties().getProperty(PREFIX+code)==='approved'});
  }
  if (action !== 'catalog') return output({version:2,error:'Acción no válida'});
  if (!code || PropertiesService.getScriptProperties().getProperty(PREFIX+code)!=='approved') {
    return output({version:2,approved:false,error:'Dispositivo no autorizado'});
  }
  const items=[];
  scan(DriveApp.getFolderById(FOLDER_ID),items,'ZYNEX');
  return output({version:2,approved:true,items:items});
}
function scan(folder,items,category) {
  const files=folder.getFiles();
  while(files.hasNext()) {
    const file=files.next();
    if(file.getMimeType().startsWith('video/')) {
      items.push({id:file.getId(),title:file.getName().replace(/\.[^.]+$/,''),category:category,description:'',cover:'',link:'https://drive.google.com/file/d/'+file.getId()+'/view'});
    }
  }
  const sub=folder.getFolders();
  while(sub.hasNext()) {
    const child=sub.next();
    scan(child,items,child.getName());
  }
}
/** En Apps Script: elegí esta función y ejecutala para aprobar el código indicado. */
function approveDevice() {
  const code='REEMPLAZAR'; // Ejemplo: 'ABCD2345'
  const valid=normalizedCode(code);
  if(!valid) throw Error('Reemplazá REEMPLAZAR por el código de 8 caracteres del televisor.');
  PropertiesService.getScriptProperties().setProperty(PREFIX+valid,'approved');
  console.log('Dispositivo aprobado: '+valid);
}
/** Para revocar un dispositivo, escribí su código y ejecutá esta función. */
function revokeDevice() {
  const code='REEMPLAZAR';
  const valid=normalizedCode(code);
  if(!valid) throw Error('Ingresá un código válido');
  PropertiesService.getScriptProperties().deleteProperty(PREFIX+valid);
  console.log('Dispositivo revocado: '+valid);
}
/** Muestra los códigos aprobados en el registro, sin exponerlos públicamente. */
function listDevices() {
  const all=PropertiesService.getScriptProperties().getProperties();
  console.log(Object.keys(all).filter(x=>x.startsWith(PREFIX)&&all[x]==='approved').map(x=>x.slice(PREFIX.length)));
}
