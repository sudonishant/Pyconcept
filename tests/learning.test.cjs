'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const C = require('../learning-core.js');

test('highlighter preserves exact text without recursively highlighting its markup', () => {
  const source = 'print("class self <script>#tag</script>") # comment';
  const html = C.highlightPython(source);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  const text = html.replace(/<[^>]*>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
  assert.equal(text, source);
  assert.ok(!text.includes('class="st"'));
});
test('comments ignore # inside quoted strings', () => {
  assert.equal(C.stripComment('x = "a#b" # outside'), 'x = "a#b" ');
  assert.equal(C.stripComment('x = "a\\\"#b" # outside'), 'x = "a\\\"#b" ');
});
test('bracket balance ignores string contents and comments', () => {
  assert.equal(C.balanced('print("(]") # {'), true);
  assert.equal(C.balanced('([)]'), false);
  assert.equal(C.balanced('print('), false);
});
for (const [source, expected] of [
  ['set()', []], ['{}', null], ['{1,2,2,3}', [1,2,3]],
  ['{"a,b", "x#y", ""}', ['a,b','x#y','']],
  ['{1, "1", -2.5, 1e2,}', [1,'1',-2.5,100]],
  ['{True}', null], ['{unknown}',null], ['{[1]}',null],
  ['{1,,2}',null], ['{"a\\n"}', ['a\n']], ['{f"x"}',null]
]) test('bounded literal parser: '+source, () => assert.deepEqual(C.parseSetLiteral(source), expected));
test('CSV text inputs remain strings and filter blank items', () => {
  assert.deepEqual(C.splitTextSet('1, 01,1, , 2'), ['1','01','2']);
  assert.deepEqual(C.splitTextSet(''), []);
});
for (const [op, expected] of [['union',[1,2,3,4]],['intersection',[3]],['difference',[1,2]],['symdiff',[1,2,4]]]) {
  test('set operation '+op+' does not mutate inputs', () => {
    const a=[1,2,2,3], b=[3,4];
    assert.deepEqual(C.setOperation(a,b,op),expected);
    assert.deepEqual(a,[1,2,2,3]); assert.deepEqual(b,[3,4]);
    assert.deepEqual(C.setOperation([],[],op),[]);
  });
}
test('unknown operation fails explicitly', () => assert.throws(()=>C.setOperation([],[],'other')));

// Expose fixture data only in this isolated test context; no app-only test API.
const source = fs.readFileSync(require.resolve('../learning-guide.js'),'utf8').replace('  const controllers={};','  globalThis.lessonFixtures=lessons;\n  const controllers={};');
const context={window:{PyLearningCore:C}, document:{getElementById:()=>null,addEventListener:()=>{}}};
vm.createContext(context); vm.runInContext(source,context);
for (const topic of ['sets','oop']) test(topic+' reviewed trace matches real Python output and valid line indices', () => {
  const lesson=context.lessonFixtures[topic];
  const result=spawnSync('python3',['-c',lesson.code.join('\n')],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stdout.trimEnd(),lesson.steps.at(-1).out);
  assert.equal(lesson.steps[0].out,'');
  for(const step of lesson.steps) assert.ok(step.line>=-1 && step.line<lesson.code.length);
});
test('OOP fixture shows independent instances and method-body execution', () => {
  const lesson=context.lessonFixtures.oop, final=lesson.steps.at(-1);
  assert.equal(final.objects[0].name,'Mira');
  assert.equal(final.objects[1].name,'Kabir');
  assert.ok(lesson.steps.some(s=>s.line===2));
  assert.ok(lesson.steps.some(s=>s.line===4));
  assert.notEqual(context.lessonFixtures.sets.steps,lesson.steps);
});
test('unsupported numeric precision and invalid Python leading zeros are rejected', () => {
  assert.equal(C.parseSetLiteral('{9007199254740993}'),null);
  assert.equal(C.parseSetLiteral('{01}'),null);
  assert.deepEqual(C.parseSetLiteral('{0, 00}'),[0]);
});
test('inline application scripts parse and attribution is present', () => {
  const path=require('node:path');
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(match[1].includes('application/ld+json')) { JSON.parse(match[2]); continue; }
    if(match[2].trim()) new vm.Script(match[2]);
  }
  assert.ok(html.includes('Created by <strong>Nishant Kumar</strong>'));
  assert.ok(html.includes('<strong>CSEAI</strong>'));
  for(const name of ['learning-core.js','learning-guide.js','learning-guide.css']) assert.ok(fs.existsSync(path.join(__dirname,'..',name)));
});
test('argument splitting preserves string literals and nested expressions', () => {
  assert.deepEqual(C.splitPythonArguments('"Set A:", A, len(A), "a,b"'),['"Set A:"','A','len(A)','"a,b"']);
  assert.equal(C.splitPythonArguments('A,,B'),null);
  assert.equal(C.stringValue('"a" + "b"'),null);
});
function setsHarness() {
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const elements=new Map();
  const node=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',style:{}});return elements.get(id);};
  const ctx={PyLearningCore:C,document:{getElementById:node},clearInterval:()=>{},simTimer:null,simPlaying:false,simSteps:[],simCurrent:-1,simOp:'intersection',
    escHtml:C.escapeHTML,renderSimCode:()=>{},updateLineNums:()=>{},recordActivityLog:()=>{},simStep:()=>{},getSetOpExplanation:()=>'',getSetOpChips:()=>'',parseSetLiteral:C.parseSetLiteral,executeRealPython:()=>{ctx.interpreterFallback=true;}};
  vm.createContext(ctx);
  for(const name of ['formatPySet','computeOp','syncSetsEditorFromInputs','startSimSets']) {
    const start=html.indexOf('function '+name+'('), end=html.indexOf('\n}',start)+2;
    assert.ok(start>=0 && end>start);
    vm.runInContext(html.slice(start,end),ctx);
  }
  return {ctx,node};
}
test('actual generated Sets lab trace reaches correctly labelled printed output', () => {
  const {ctx,node}=setsHarness();
  node('sim-set-a').value='1, 01, 1';node('sim-set-b').value='01, 2';
  ctx.syncSetsEditorFromInputs();ctx.startSimSets();
  assert.equal(node('sim-syntax-err').style.display,'none');
  assert.ok(ctx.simSteps.at(-1).msg.includes('Result: {"01"}'));
  assert.ok(ctx.simSteps.at(-1).msg.includes('Total Elements: 1'));
  assert.ok(!ctx.interpreterFallback);
});
test('actual generated Sets lab trace handles empty inputs without placeholder students', () => {
  const {ctx,node}=setsHarness();ctx.syncSetsEditorFromInputs();ctx.startSimSets();
  assert.ok(ctx.simSteps.at(-1).msg.includes('Result: set()'));
  assert.ok(ctx.simSteps.at(-1).msg.includes('Total Elements: 0'));
});
test('invalid edit clears previous Sets steps instead of replaying stale results', () => {
  const {ctx,node}=setsHarness();ctx.syncSetsEditorFromInputs();ctx.startSimSets();
  assert.ok(ctx.simSteps.length>0);
  node('sim-editor').value='A = {}';ctx.startSimSets();
  assert.equal(ctx.simSteps.length,0);
  assert.equal(node('sim-syntax-err').style.display,'block');
  assert.ok(node('sim-syntax-err').textContent.includes('{} is a dict'));
});
test('unfiltered split comprehension keeps the Python empty string member', () => {
  const {ctx,node}=setsHarness();
  node('sim-editor').value='raw_a = input("A")\nA = set([x.strip() for x in raw_a.split(",")])\nprint(A)';
  ctx.startSimSets();assert.ok(ctx.simSteps.at(-1).msg.includes('{""}'));
});
function oopHarness() {
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const elements=new Map();
  const node=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',style:{}});return elements.get(id);};
  const ctx={PyLearningCore:C,document:{getElementById:node,querySelector:node},clearInterval:()=>{},oopTimer:null,oopPlaying:false,oopSteps:[],oopObjects:[],oopCurrent:-1,oopCodeLines:[],DEFAULT_OOP_CODE:'',
    escHtml:C.escapeHTML,renderOOPCode:()=>{},updateOOPPanel:()=>{},recordActivityLog:()=>{},oopStep:()=>{},executeRealPython:()=>{ctx.interpreterFallback=true;}};
  vm.createContext(ctx);
  for(const name of ['parsePyArgs','formatPyVal','evalFString','resetOOP','runOOPCode']) {
    const start=html.indexOf('function '+name+'('), end=html.indexOf('\n}',start)+2;
    assert.ok(start>=0 && end>start);vm.runInContext(html.slice(start,end),ctx);
  }
  return {ctx,node};
}
const oopSample='class Student:\n    def __init__(self, name):\n        self.name = name\n    def introduce(self):\n        return f"Hi, {self.name}"\ns1 = Student("Asha#(]")\ns2 = Student("Kabir")\nprint(s1.introduce())\nprint(s2.introduce())';
test('actual OOP subset trace prints method results with separate object snapshots', () => {
  const {ctx,node}=oopHarness();node('oop-editor').value=oopSample;ctx.runOOPCode();
  assert.equal(node('oop-syntax-err').style.display,'none');
  assert.ok(ctx.oopSteps.at(-1).msg.includes('Hi, Asha#(]\nHi, Kabir'));
  assert.equal(ctx.oopObjects[0].attrs.name,'Asha#(]');assert.equal(ctx.oopObjects[1].attrs.name,'Kabir');
  const python=spawnSync('python3',['-c',oopSample],{encoding:'utf8'});
  assert.equal(python.status,0);assert.ok(ctx.oopSteps.at(-1).msg.endsWith(python.stdout.trimEnd()));
});
test('invalid OOP edit clears stale steps and hides controls', () => {
  const {ctx,node}=oopHarness();node('oop-editor').value=oopSample;ctx.runOOPCode();
  assert.ok(ctx.oopSteps.length>0);
  node('oop-editor').value='print(';ctx.runOOPCode();
  assert.equal(ctx.oopSteps.length,0);assert.equal(node('oop-vis-controls').style.display,'none');
  assert.equal(node('oop-syntax-err').style.display,'block');
});
test('unsupported OOP top-level statement is explicit rather than silently ignored', () => {
  const {ctx,node}=oopHarness();node('oop-editor').value=oopSample+'\ns1.name = "Mira"';ctx.runOOPCode();
  assert.equal(ctx.oopSteps.length,0);assert.ok(node('oop-syntax-err').textContent.includes('unsupported statement'));
});
