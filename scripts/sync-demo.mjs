// Optional authoring helper: snapshot the demo's own render functions into HTML.
// Hosting still needs no Node runtime, server, dependencies, or build step.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('landing.js', root), 'utf8');
const nodes = new Map();
const get = selector => {
  if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', attributes: {}, setAttribute(k,v){this.attributes[k]=v;} });
  return nodes.get(selector);
};
const document = { querySelector: get, querySelectorAll: () => [] };
const cutoff = source.indexOf('const preference=');
if(cutoff<0)throw new Error('Demo rendering boundary missing');
vm.runInNewContext(source.slice(0,cutoff)+'})();', {document, innerWidth:1280, Intl, Date});
let html = readFileSync(new URL('index.html',root),'utf8');
for (const id of ['record-count','statement-income','statement-purchases','statement-available','statement-rows','markdown-lines','json-records','transaction-rows','transaction-total','month-bars','legend','capacity-value','capacity-label','wealth-value','wealth-label','wealth-chart']) {
  const node = get('#'+id);
  let content = node.innerHTML || node.textContent;
  // Static presentation controls do not pretend to work before enhancement.
  content = content.replace(/<button /g,'<button disabled ');
  // Initial static structured data is fully categorized; JS animates the same result.
  if(id==='json-records') {
    const transactions = vm.runInNewContext(source.slice(source.indexOf('const transactions ='),source.indexOf('// Demonstration confidence'))+'transactions');
    let index=0;
    content=content.replace(/class="category-value">null/g,()=>`class="category-value">"${transactions[index++].category}"`);
    let confidenceIndex=0;
    content=content.replace(/class="json-confidence">null/g,()=>`class="json-confidence">"${[3,8].includes(confidenceIndex++)?'review':'high'}"`);
  }
  const start=`<!--demo:${id}-->`,end=`<!--/demo:${id}-->`;
  if(html.includes(start))html=html.replace(new RegExp(start+'[\\s\\S]*?'+end),start+content+end);
  else {
    const pattern=new RegExp('(<([a-z]+)[^>]*\\bid="'+id+'"[^>]*>)[\\s\\S]*?(</\\2>)');
    if(!pattern.test(html))throw new Error('Missing target '+id);
    html=html.replace(pattern,(_,open,tag,close)=>open+start+content+end+close);
  }
}
writeFileSync(new URL('index.html',root),html);
console.log('Static demo synchronized from landing.js');
