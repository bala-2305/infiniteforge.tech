(function(){
  // Editors
  let htmlEditor, cssEditor, jsEditor;
  const runBtn = document.getElementById('run-btn');
  const debugBtn = document.getElementById('debug-btn');
  const exportBtn = document.getElementById('export-btn');
  const themeSelect = document.getElementById('theme-select');
  const stepBtn = document.getElementById('step-btn');
  const continueBtn = document.getElementById('continue-btn');
  const stopBtn = document.getElementById('stop-btn');
  const breakpointsInput = document.getElementById('breakpoints-input');
  const previewIframe = document.getElementById('preview-iframe');
  const debugConsole = document.getElementById('debug-console');
  const debugLogs = document.getElementById('debug-console-logs');

  const statusEl = document.getElementById('status');

  // Simple debug session state
  let debugSession = null;

  function setStatus(msg){ statusEl.textContent = msg; }

  function appendDebug(msg){
    if(!debugLogs) return;
    const d = document.createElement('div'); d.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg; debugLogs.appendChild(d); debugLogs.scrollTop = debugLogs.scrollHeight;
  }

  function initEditors(){
    htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-code'), { mode: 'xml', htmlMode: true, lineNumbers:true, theme: 'default' });
    cssEditor = CodeMirror.fromTextArea(document.getElementById('css-code'), { mode: 'css', lineNumbers:true, theme: 'default' });
    jsEditor = CodeMirror.fromTextArea(document.getElementById('js-code'), { mode: 'javascript', lineNumbers:true, theme: 'default' });

    // Default content
    const defaultHTML = `<!doctype html>\n<html><head><meta charset=\"utf-8\"></head><body>\n  <h1>Hello HTML Playground</h1>\n  <button onclick=\"change()\">Click</button>\n  <script>function change(){document.body.style.background='#ffebcd'}</script>\n</body></html>`;
    const defaultCSS = `body { font-family: system-ui, sans-serif; padding: 20px; } h1 { color:#0b74a6 }`;
    const defaultJS = `console.log('Hello from JS');\nlet count=0;`;

    htmlEditor.setValue(defaultHTML);
    cssEditor.setValue(defaultCSS);
    jsEditor.setValue(defaultJS);

    // Tab switching UI
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const ed = t.dataset.editor;
      document.querySelectorAll('.editor-panel').forEach(p=>p.classList.remove('active'));
      document.getElementById(ed+'-panel').classList.add('active');
      setTimeout(()=>{ if(ed==='html') htmlEditor.refresh(); if(ed==='css') cssEditor.refresh(); if(ed==='js') jsEditor.refresh(); }, 50);
    }));
  }

  // Build preview HTML and write to iframe
  function updatePreview(){
    const html = htmlEditor.getValue();
    const css = cssEditor.getValue();
    const js = jsEditor.getValue();

    const combined = `<!doctype html><html><head><meta charset=\"utf-8\"><style>${css}</style></head><body>${html}<script>\n// redirect console to parent\n(function(){var _c=console;console={log:function(){parent.postMessage({htmlPlaygroundDebug:true,payload:{type:'console',line:Array.from(arguments).join(' ')}},'*');_c.log.apply(_c,arguments);},error:function(){parent.postMessage({htmlPlaygroundDebug:true,payload:{type:'console',line:Array.from(arguments).join(' ')}},'*');_c.error.apply(_c,arguments);}})();try{\n${js}\n}catch(e){parent.postMessage({htmlPlaygroundDebug:true,payload:{type:'error',message:(e&&e.message)?e.message:String(e)}},'*');}\n</script></body></html>`;

    try{
      const doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
      doc.open(); doc.write(combined); doc.close();
      setStatus('Preview updated');
    }catch(e){ setStatus('Failed to update preview: '+e.message); }
  }

  // Export combined HTML
  function exportHTML(){
    const html = htmlEditor.getValue(); const css = cssEditor.getValue(); const js = jsEditor.getValue();
    const out = `<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
    const blob = new Blob([out], {type:'text/html'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'index.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // Debug harness: semicolon-splitting best-effort (prototype)
  function startDebug(){
    const js = jsEditor.getValue() || '';
    const breakpoints = (breakpointsInput.value||'').split(',').map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n)&&n>0);
    const stmts = js.split(/;\s*(?=\S)|;\s*$/).map(s=>s.trim()).filter(Boolean);
    debugSession = { stmts, index:0, breakpoints: new Set(breakpoints), running:false };

    const harness = `(function(){window.__stmts=${JSON.stringify(debugSession.stmts)};window.__send=function(msg){parent.postMessage({htmlPlaygroundDebug:true,payload:msg},'*')};window.addEventListener('message',function(e){var d=e.data||{};if(d&&d.cmd==='runIndex'){try{var res=eval(window.__stmts[d.index]);window.__send({type:'executed',index:d.index,result:String(res)});}catch(err){window.__send({type:'error',index:d.index,message:(err&&err.message)?err.message:String(err)});}window.__send({type:'doneIndex',index:d.index});}});window.__send({type:'harnessLoaded',total:window.__stmts.length});})();`;

    // Inject harness into preview by reusing current HTML/CSS
    const html = htmlEditor.getValue() || '';
    const css = cssEditor.getValue() || '';
    const doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
    const payload = `<!doctype html><html><head><meta charset=\"utf-8\"><style>${css}</style></head><body>${html}<script>${harness}<\/script></body></html>`;
    doc.open(); doc.write(payload); doc.close();

    // UI
    stepBtn.disabled = false; continueBtn.disabled = false; stopBtn.disabled = false;
    debugConsole.style.display = 'block'; debugLogs.innerHTML = '';
    appendDebug('Debug harness loaded. total stmts: ' + debugSession.stmts.length);
  }

  function postToIframe(msg){ try{ if(previewIframe && previewIframe.contentWindow) previewIframe.contentWindow.postMessage(msg,'*'); else throw new Error('iframe not ready'); }catch(e){ appendDebug('postMessage error: '+e.message); setStatus('Debugging failed: iframe not ready'); }}

  function step(){ if(!debugSession) return; const idx = debugSession.index; postToIframe({cmd:'runIndex', index: idx}); debugSession.index++; if(debugSession.breakpoints.has(debugSession.index)) appendDebug('Paused at breakpoint '+debugSession.index); }

  function cont(){ if(!debugSession) return; debugSession.running = true; const runNext = ()=>{ if(!debugSession || debugSession.index>=debugSession.stmts.length){ finishDebug(); return; } if(debugSession.breakpoints.has(debugSession.index+1)){ debugSession.running=false; appendDebug('Paused at breakpoint '+(debugSession.index+1)); return; } postToIframe({cmd:'runIndex', index: debugSession.index}); debugSession.index++; if(debugSession.running) setTimeout(runNext, 30); }; runNext(); }

  function finishDebug(){ debugSession=null; stepBtn.disabled=true; continueBtn.disabled=true; stopBtn.disabled=true; appendDebug('Debug session ended'); }

  // Message handler from iframe/harness
  window.addEventListener('message', function(e){ const data = e.data || {}; if(!data || !data.htmlPlaygroundDebug) return; const p = data.payload || {}; if(p.type==='harnessLoaded'){ appendDebug('Harness ready: total='+p.total); } else if(p.type==='executed'){ appendDebug('Executed '+p.index+' => '+p.result); } else if(p.type==='error'){ appendDebug('Error @'+p.index+': '+p.message); setStatus('Runtime error: '+p.message); } else if(p.type==='console'){ appendDebug('console: '+p.line); } }, false);

  // UI wiring
  document.getElementById('clear-btn').addEventListener('click', ()=>{ htmlEditor.setValue(''); cssEditor.setValue(''); jsEditor.setValue(''); setStatus('Cleared'); });
  runBtn.addEventListener('click', updatePreview);
  exportBtn.addEventListener('click', exportHTML);
  debugBtn.addEventListener('click', startDebug);
  stepBtn.addEventListener('click', step);
  continueBtn.addEventListener('click', cont);
  stopBtn.addEventListener('click', finishDebug);
  themeSelect.addEventListener('change', ()=>{ const t = themeSelect.value; [htmlEditor,cssEditor,jsEditor].forEach(ed=>ed.setOption('theme', t)); });

  // Initialize
  initEditors(); updatePreview();

})();
