const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const {JSDOM} = require('jsdom');
const {openModal} = require('../ui/modal.js');
const {asyncStateMarkup} = require('../ui/async-state.js');
const root = path.resolve(__dirname, '..');
const fixture = require('./helpers/vue.cjs');

test('native shared modal traps focus, handles Escape and restores the opener',()=>{
 const dom=new JSDOM('<button id="open">Open</button><dialog><button>A</button><button>B</button></dialog>',{pretendToBeVisual:true});
 try {
  const d=dom.window.document,dialog=d.querySelector('dialog'),[first,last]=dialog.querySelectorAll('button');d.getElementById('open').focus();
  let dismissals=0;const close=openModal(dialog,()=>dismissals++);
  assert.equal(dialog.open,true);assert.equal(d.activeElement,first);
  first.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(d.activeElement,last);
  last.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(d.activeElement,first);
  dialog.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(dismissals,1);
  close();assert.equal(dialog.open,false);assert.equal(d.activeElement.id,'open');close();
 } finally {dom.window.close();}
});
test('folder selection keeps exact IDs, hierarchy and expansion when the value changes',async()=>{
 const f=fixture();let vm;
 try {
  vm=f.mount({data:()=>({selected:'0',folders:[{id:'0',title:'Root',children:[{id:'1',title:'<Private>',children:[{id:'2',title:'Nested'}]},{id:'99',url:'https://ignored.test'}]}]}),render(){const {h,resolveComponent}=f.Vue;return h(resolveComponent('UiFolderTree'),{items:this.folders,value:this.selected,label:'Folders',emptyLabel:'Untitled',onInput:value=>this.selected=value});}});
  const d=f.w.document;assert.equal(d.querySelectorAll('input').length,3);assert.equal(d.querySelector('private'),null);
  const branches=d.querySelectorAll('details');branches[1].open=true;
  const last=d.querySelectorAll('input')[2];last.checked=true;last.dispatchEvent(new f.w.Event('change',{bubbles:true}));await f.Vue.nextTick();
  assert.equal(vm.selected,'2');assert.equal(d.querySelectorAll('details')[1].open,true);assert.equal(d.querySelector('input:checked').getAttribute('aria-label'),'Nested');
 } finally {f.close();}
});
test('wizard lazily mounts steps, retains draft controls and focuses the next heading',async()=>{
 const f=fixture();let vm;
 try {
  vm=f.mount({data:()=>({step:0}),render(){const {h,resolveComponent}=f.Vue;return h('div',[0,1].map(i=>h(resolveComponent('UiWizardStep'),{key:i,active:this.step===i},{default:()=>[h('h2','Step '+i),h('input',{id:'draft-'+i})]})));}});
  const d=f.w.document;assert.equal(d.querySelector('#draft-1'),null);d.querySelector('#draft-0').value='Keep draft';
  vm.step=1;await f.Vue.nextTick();await f.Vue.nextTick();assert.equal(d.activeElement.textContent,'Step 1');assert.equal(d.querySelector('#draft-0').closest('section').hidden,true);
  vm.step=0;await f.Vue.nextTick();assert.equal(d.querySelector('#draft-0').value,'Keep draft');
 } finally {f.close();}
});
test('all async presentations escape errors, clamp progress and preserve indeterminate progress',()=>{
 const dom=new JSDOM(asyncStateMarkup({kind:'error',text:'<img src=x>',detail:'Private <data>',progress:120,retry:'Retry'}));
 try {const d=dom.window.document;assert.equal(d.querySelector('img'),null);assert.equal(d.querySelector('[role=alert]').textContent,'<img src=x>Private <data>Retry');assert.equal(d.querySelector('progress').value,100);
 d.body.innerHTML=asyncStateMarkup({kind:'loading',text:'Loading',progress:null});assert.equal(d.querySelector('progress').hasAttribute('value'),false);assert.equal(d.querySelector('[aria-busy]').getAttribute('aria-busy'),'true');
 } finally {dom.window.close();}
});
