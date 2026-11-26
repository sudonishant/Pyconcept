/* Separate Topic 14 and Topic 23 lessons. No shared learner state. */
(function () {
  'use strict';
  const C=window.PyLearningCore, esc=C.escapeHTML;
  const lessons={
    sets:{number:14,title:'Sets: keep only what overlaps',summary:'One idea, one example: a set removes duplicates; intersection keeps shared items.',
      code:['A = {1, 2, 2, 3}','B = {3, 4}','shared = A & B','print(shared)'],
      question:'Before running: what will print(shared) display?',answer:'3',answerLabel:'{3}',
      steps:[
        {line:-1,A:[],B:[],readyA:false,readyB:false,result:null,out:'',text:'Predict first, then press Next. A and B do not exist yet. These are prepared teaching steps, not arbitrary Python execution.'},
        {line:0,A:[1,2,3],B:[],readyA:true,readyB:false,result:null,out:'',text:'Python builds A. The repeated 2 is stored only once. A has three unique elements; displayed positions are not Python set indices.'},
        {line:1,A:[1,2,3],B:[3,4],readyA:true,readyB:true,result:null,out:'',text:'B contains 3 and 4. Notice 3 appears in both circles. No output has been printed yet.'},
        {line:2,A:[1,2,3],B:[3,4],readyA:true,readyB:true,result:[3],out:'',text:'& computes the intersection. Only 3 belongs to both A and B. Neither original set is changed.'},
        {line:3,A:[1,2,3],B:[3,4],readyA:true,readyB:true,result:[3],out:'{3}',text:'print(shared) displays {3}. A set is unordered; this diagram is an illustration, not a memory layout. Try the full Sets Lab next.'}
      ],
      checkpoints:['Repeated items disappear.','& means shared members, not all members.','A and B are unchanged by A & B.']},
    oop:{number:23,title:'OOP: one blueprint, two independent objects',summary:'Watch a class create two instances. Changing one instance does not rename the other.',
      code:['class Student:','    def __init__(self, name):','        self.name = name','    def introduce(self):','        return "Hi, " + self.name','s1 = Student("Asha")','s2 = Student("Kabir")','s1.name = "Mira"','print(s1.introduce())','print(s2.introduce())'],
      question:'Predict the final two lines: which greetings will print?',answer:'hi, mira hi, kabir',answerLabel:'Hi, Mira / Hi, Kabir',
      steps:[
        {line:-1,blueprint:false,objects:[],out:'',text:'Predict first. This example is about instance attributes only; it does not mix in set operations.'},
        {line:0,blueprint:true,objects:[],out:'',text:'Executing the class definition creates Student and defines __init__. Its method body has not run yet. A class is the blueprint, not a student instance.'},
        {line:5,blueprint:true,objects:[],out:'',text:'Student("Asha") starts a call. __new__ creates an instance, then __init__ initializes it. The name s1 is bound only after the call returns.'},
        {line:2,blueprint:true,objects:[{ref:'self (initializing)',id:'demo-01',name:'Asha'}],out:'',text:'Inside __init__, self is the new instance and name is "Asha". self.name = name stores its instance attribute; nothing is printed.'},
        {line:5,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Asha'}],out:'',text:'Initialization finishes. s1 now refers to demo-01, a Student instance whose name is Asha.'},
        {line:6,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Asha'}],out:'',text:'Student("Kabir") starts a separate call. s1 still refers to Asha; s2 is not bound until this call returns.'},
        {line:2,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Asha'},{ref:'self (initializing)',id:'demo-02',name:'Kabir'}],out:'',text:'The same __init__ method runs again, but self now refers to demo-02. Its name attribute becomes Kabir, independently of demo-01.'},
        {line:6,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Asha'},{ref:'s2',id:'demo-02',name:'Kabir'}],out:'',text:'The second call returns. s1 and s2 refer to different objects, each with its own name attribute.'},
        {line:7,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Mira'},{ref:'s2',id:'demo-02',name:'Kabir'}],out:'',text:'Only s1.name changes to Mira. s2.name stays Kabir. Ordinary instance attributes are not automatically private. Demo IDs are not real memory addresses.'},
        {line:4,blueprint:true,objects:[{ref:'s1 / self',id:'demo-01',name:'Mira'},{ref:'s2',id:'demo-02',name:'Kabir'}],out:'',text:'s1.introduce() runs with self pointing to s1. return computes "Hi, Mira"; returning is not printing, so the console is still empty.'},
        {line:8,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Mira'},{ref:'s2',id:'demo-02',name:'Kabir'}],out:'Hi, Mira',text:'The returned string reaches print(), which writes the first greeting. Methods are defined on the class and receive the current instance as self.'},
        {line:4,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Mira'},{ref:'s2 / self',id:'demo-02',name:'Kabir'}],out:'Hi, Mira',text:'s2.introduce() uses the same method with a different self. It returns "Hi, Kabir"; the earlier output remains unchanged.'},
        {line:9,blueprint:true,objects:[{ref:'s1',id:'demo-01',name:'Mira'},{ref:'s2',id:'demo-02',name:'Kabir'}],out:'Hi, Mira\nHi, Kabir',text:'The second print adds Hi, Kabir. One class supplies behavior; two instances keep separate state. Open the OOP Lab for editable examples.'}
      ],checkpoints:['Class ≠ instance.','self refers to the current instance.','Separate instance attributes hold separate state.']}
  };
  const controllers={};
  function diagram(topic,s){
    if(topic==='sets'){
      const a=s.readyA?s.A:[],b=s.readyB?s.B:[],both=a.filter(x=>b.includes(x));
      const nums=(xs)=>xs.map(x=>'<span class="guide-token'+(s.result&&s.result.includes(x)?' result':'')+'">'+x+'</span>').join('')||'<span class="guide-muted">—</span>';
      return '<div class="guide-venn" role="img" aria-label="Set A, shared region and Set B"><div><b>A only</b>'+nums(a.filter(x=>!b.includes(x)))+'</div><div class="guide-overlap"><b>A ∩ B</b>'+nums(both)+'</div><div><b>B only</b>'+nums(b.filter(x=>!a.includes(x)))+'</div></div><div class="guide-state"><span>A: '+(s.readyA?'{'+s.A.join(', ')+'}':'not defined')+'</span><span>B: '+(s.readyB?'{'+s.B.join(', ')+'}':'not defined')+'</span><span>shared: '+(s.result?'{'+s.result.join(', ')+'}':'not computed')+'</span></div>';
    }
    return '<div class="guide-blueprint">'+(s.blueprint?'Student class · blueprint ready':'Student class · not defined yet')+'</div><div class="guide-objects">'+(s.objects.length?s.objects.map(o=>'<div class="guide-object"><b>'+esc(o.ref)+' → '+esc(o.id)+'</b><span>Student instance</span><code>name = '+esc(JSON.stringify(o.name))+'</code></div>').join(''):'<p class="guide-muted">No student instances yet.</p>')+'</div><p class="guide-muted">Demo object IDs only · object state, not a literal CPython heap diagram</p>';
  }
  function mount(topic){
    const lesson=lessons[topic],host=document.getElementById('page-'+topic);
    if(!host)return;
    const section=document.createElement('section');section.className='guided-lesson';section.setAttribute('aria-label','Guided Topic '+lesson.number+' lesson');
    section.innerHTML='<details id="guide-'+topic+'"><summary><span>START HERE · TOPIC '+lesson.number+'</span><strong>'+esc(lesson.title)+'</strong><span>Predict → step → explain · about 2 minutes</span></summary><div class="guide-body"><div class="guide-heading"><p>'+esc(lesson.summary)+'</p><button type="button" data-action="focus">Focus this lesson</button><button type="button" data-action="exit">Show full topic</button></div><p class="guide-mode">TEACHING TRACE · fixed, reviewed example · no runtime download required. Editable Python remains in this topic’s separate Lab.</p><div class="guide-predict"><label for="guide-answer-'+topic+'">'+esc(lesson.question)+'</label><div><input id="guide-answer-'+topic+'" type="text" autocomplete="off" placeholder="Your prediction"><button type="button" data-action="check">Check prediction</button></div><p data-feedback role="status" aria-live="polite"></p></div><div class="guide-grid"><div><h3>Follow the Python</h3><div class="guide-code" data-code></div></div><div><h3>Watch the state</h3><div data-diagram></div><h3>Printed output</h3><pre class="guide-output" data-output aria-label="Printed output"></pre></div></div><p class="guide-explanation" data-explanation role="status" aria-live="polite"></p><div class="guide-controls"><button type="button" data-action="back">Back</button><button type="button" data-action="next">Next</button><button type="button" data-action="play">Play</button><button type="button" data-action="reset">Reset</button><label>Step delay <input data-speed aria-label="Topic '+lesson.number+' step delay" type="range" min="400" max="2200" value="1200" step="100"><output data-speed-value>1.2 s</output></label><span data-progress></span></div><div class="guide-takeaway"><h3>Explain these three things</h3><ul>'+lesson.checkpoints.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><button type="button" data-action="lab">Continue to '+(topic==='sets'?'Sets':'OOP')+' Lab →</button></div></div></details>';
    host.prepend(section);
    let current=0,timer=null;
    const find=s=>section.querySelector(s), action=name=>find('[data-action="'+name+'"]');
    function pause(){clearTimeout(timer);timer=null;action('play').textContent='Play';action('play').setAttribute('aria-pressed','false');}
    function render(){const s=lesson.steps[current];find('[data-code]').innerHTML=lesson.code.map((line,i)=>'<div class="guide-code-line'+(i===s.line?' active':'')+'"'+(i===s.line?' aria-current="step"':'')+'><span aria-hidden="true">'+(i+1)+'</span><code>'+C.highlightPython(line)+'</code></div>').join('');find('[data-diagram]').innerHTML=diagram(topic,s);find('[data-output]').textContent=s.out||'(nothing printed yet)';find('[data-explanation]').textContent=s.text;find('[data-progress]').textContent='Step '+current+' / '+(lesson.steps.length-1);action('back').disabled=current===0;action('next').disabled=current===lesson.steps.length-1;if(current===lesson.steps.length-1)pause();}
    function next(){if(current<lesson.steps.length-1){current++;render();}}
    function schedule(){timer=setTimeout(()=>{next();if(current<lesson.steps.length-1)schedule();},Number(find('[data-speed]').value));}
    action('next').onclick=()=>{pause();next();};action('back').onclick=()=>{pause();current=Math.max(0,current-1);render();};
    action('play').onclick=()=>{if(timer){pause();return;}if(current===lesson.steps.length-1)current=0;render();action('play').textContent='Pause';action('play').setAttribute('aria-pressed','true');schedule();};
    action('reset').onclick=()=>{pause();current=0;find('[data-feedback]').textContent='';find('input[type=text]').value='';render();};
    action('check').onclick=()=>{const answer=find('input[type=text]').value.toLowerCase().replace(/[{}\[\]"']/g,'').trim().replace(/\s+/g,' ');find('[data-feedback]').textContent=!answer?'Type a prediction first.':answer===lesson.answer?'Correct. Now step through the code to explain why.':'Not yet. Step through the code, then compare with '+lesson.answerLabel+'.';};
    find('[data-speed]').oninput=()=>{find('[data-speed-value]').textContent=(Number(find('[data-speed]').value)/1000).toFixed(1)+' s';if(timer){pause();action('play').click();}};
    action('focus').onclick=()=>{document.body.classList.add('focus-lesson');section.scrollIntoView({block:'start'});};action('exit').onclick=()=>document.body.classList.remove('focus-lesson');
    action('lab').onclick=()=>{pause();document.body.classList.remove('focus-lesson');window.showTopicTab(topic,'lab');find('details').open=false;};
    find('details').addEventListener('toggle',()=>{if(!find('details').open)pause();});
    controllers[topic]={pause,open(){find('details').open=true;document.body.classList.add('focus-lesson');section.scrollIntoView({block:'start'});}};render();
  }
  mount('sets');mount('oop');
  window.pauseGuidedLessons=function(){Object.values(controllers).forEach(c=>c.pause());document.body.classList.remove('focus-lesson');};
  window.openGuidedLesson=function(topic){if(!controllers[topic])return;window.showPage(topic);window.showTopicTab(topic,'intro');controllers[topic].open();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)Object.values(controllers).forEach(c=>c.pause());});
})();
