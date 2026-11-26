/* Pure teaching utilities. No credentials, network, eval, or storage. */
(function (root) {
  'use strict';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const keywords = new Set('class def return for in if else elif import from as True False None and or not while break continue pass with is lambda yield try except finally raise'.split(' '));
  const builtins = new Set('print input len set int float str bool list dict tuple frozenset super range isinstance'.split(' '));
  // Tokenize source BEFORE producing HTML: markup is never re-highlighted.
  function tokens(source) {
    const s = String(source), result = [];
    let i = 0;
    while (i < s.length) {
      const start = i, ch = s[i];
      if (ch === '#') { result.push({kind:'comment', text:s.slice(i)}); break; }
      let prefix = '';
      if (/[fFrRuUbB]/.test(ch) && (s[i+1] === '"' || s[i+1] === "'")) prefix = s[i++];
      if (s[i] === '"' || s[i] === "'") {
        const quote = s[i++];
        while (i < s.length) {
          if (s[i] === '\\') { i = Math.min(s.length, i+2); continue; }
          if (s[i++] === quote) break;
        }
        result.push({kind:'string', text:s.slice(start,i), prefix}); continue;
      }
      i = start;
      const word = /^[A-Za-z_]\w*/.exec(s.slice(i));
      if (word) {
        const text = word[0]; i += text.length;
        result.push({kind:keywords.has(text)?'keyword':builtins.has(text)?'builtin':text==='self'?'self':'plain',text}); continue;
      }
      const num = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(s.slice(i));
      if (num) { i += num[0].length; result.push({kind:'number',text:num[0]}); continue; }
      result.push({kind:'plain',text:s[i++]});
    }
    return result;
  }
  function highlightPython(source) {
    const classes = {string:'st',comment:'cm',keyword:'kw',builtin:'fn',self:'py-self',number:'py-number'};
    return tokens(source).map(t => classes[t.kind] ? '<span class="'+classes[t.kind]+'">'+escapeHTML(t.text)+'</span>' : escapeHTML(t.text)).join('');
  }
  function stripComment(source) { return tokens(source).filter(t=>t.kind!=='comment').map(t=>t.text).join(''); }
  function balanced(source) {
    const stack = [], pairs = {')':'(',']':'[','}':'{'};
    for (const t of tokens(source)) {
      if (t.kind==='string' || t.kind==='comment') continue;
      for (const c of t.text) {
        if ('([{'.includes(c)) stack.push(c);
        else if (')]}'.includes(c) && stack.pop()!==pairs[c]) return false;
      }
    }
    return stack.length===0;
  }
  function stringValue(token) {
    const ts = tokens(token);
    if (ts.length !== 1 || ts[0].kind !== 'string' || ts[0].prefix) return null;
    if (!/^(['"])/.test(token) || token.at(-1)!==token[0]) return null;
    let out='';
    const escapes = {n:'\n',r:'\r',t:'\t','\\':'\\',"'":"'",'"':'"'};
    for (let i=1;i<token.length-1;i++) {
      if (token[i]==='\\') { const c=token[++i]; if (!(c in escapes)) return null; out+=escapes[c]; }
      else out+=token[i];
    }
    return out;
  }
  // Deliberately bounded visualizer grammar, not an arbitrary Python parser.
  // {} is a dict, never an empty set. Unsupported literals return null.
  function parseSetLiteral(source) {
    const s=stripComment(String(source)).trim();
    if (/^set\(\s*\)$/.test(s)) return [];
    if (!s.startsWith('{') || !s.endsWith('}') || !s.slice(1,-1).trim() || !balanced(s)) return null;
    const ts=tokens(s.slice(1,-1)), parts=[]; let part='';
    for (const t of ts) {
      if (t.kind!=='string' && t.text===',') { parts.push(part.trim());part=''; }
      else part+=t.text;
    }
    if(part.trim())parts.push(part.trim());
    if(!parts.length || parts.some(p=>!p))return null;
    const vals=[];
    for(const p of parts){
      let v;
      if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(p)){
        if (/^[-+]?0\d+$/.test(p) && /[1-9]/.test(p)) return null;
        v=Number(p);
        // Reject integers that JavaScript cannot represent exactly instead of teaching a rounded value.
        if(!Number.isFinite(v) || (Number.isInteger(v) && !Number.isSafeInteger(v)))return null;
      }
      else {const ts=tokens(p);if(ts.length!==1 || ts[0].kind!=='string' || ts[0].prefix)return null;v=stringValue(p);if(v===null)return null;}
      if(!vals.includes(v))vals.push(v);
    }
    return vals;
  }
  function splitPythonArguments(source) {
    if (!balanced(source)) return null;
    const parts=[]; let part='', depth=0;
    for (const t of tokens(source)) {
      if (t.kind === 'comment') return null;
      if (t.kind !== 'string') {
        if ('([{'.includes(t.text)) depth++;
        else if (')]}'.includes(t.text)) depth--;
        if (t.text === ',' && depth === 0) {
          if (!part.trim()) return null;
          parts.push(part.trim()); part=''; continue;
        }
      }
      part += t.text;
    }
    if (part.trim()) parts.push(part.trim());
    return parts;
  }
  function splitTextSet(source) { return [...new Set(String(source).split(',').map(s=>s.trim()).filter(Boolean))]; }
  function setOperation(a,b,op) {
    const A=[...new Set(a)], B=[...new Set(b)];
    if(op==='union')return [...new Set([...A,...B])];
    if(op==='intersection')return A.filter(x=>B.includes(x));
    if(op==='difference')return A.filter(x=>!B.includes(x));
    if(op==='symdiff')return [...A.filter(x=>!B.includes(x)),...B.filter(x=>!A.includes(x))];
    throw new Error('Unknown set operation');
  }
  const api=Object.freeze({escapeHTML,tokens,highlightPython,stripComment,balanced,stringValue,parseSetLiteral,splitPythonArguments,splitTextSet,setOperation});
  root.PyLearningCore=api;
  if(typeof module!=='undefined' && module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
