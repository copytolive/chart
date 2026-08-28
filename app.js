(() => {
  const state = {
    candles: [], visible: 128, offset: 0, hover: null, dragging: false, dragX: 0,
    activeTool: 'cross', magnet: false, locked: false, hiddenDrawings: false, replay: false,
  };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const canvas = $('#chartCanvas');
  const wrap = $('#chartWrap');
  const ctx = canvas.getContext('2d');
  const fmt = n => n.toLocaleString('id-ID', {maximumFractionDigits:0});
  const fmt1 = n => n.toLocaleString('id-ID', {maximumFractionDigits:1});

  function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  function generateCandles(){
    const rng=mulberry32(20260512), out=[]; let p=101000; const start=new Date('2025-11-05T00:00:00Z');
    const anchors=[101000,93000,87500,90500,87000,89000,96000,88500,67500,66500,73500,69000,66500,73500,78500,81850];
    const total=190;
    for(let i=0;i<total;i++){
      const t=i/(total-1)*(anchors.length-1), a=Math.floor(t), f=t-a;
      const target=(anchors[a]??anchors.at(-1))*(1-f)+(anchors[Math.min(a+1,anchors.length-1)]??anchors.at(-1))*f;
      const noise=(rng()-.5)*3600 + Math.sin(i*.63)*1100;
      const close=target+noise*0.45;
      const open=i?out[i-1].close+(rng()-.5)*1700:p;
      const high=Math.max(open,close)+450+rng()*1900;
      const low=Math.min(open,close)-450-rng()*1900;
      let vol=380+rng()*780;
      if(i>84&&i<124) vol*=1.65;
      if(i===88||i===91) vol*=2.2;
      const d=new Date(start.getTime()+i*86400000);
      out.push({time:d,open,high,low,close,volume:vol});
      p=close;
    }
    // Force last values close to visual reference.
    const last=out[out.length-1]; Object.assign(last,{open:82197,high:82361,low:80429,close:81847,volume:1030});
    return out;
  }
  state.candles=generateCandles();

  function resize(){
    const r=wrap.getBoundingClientRect(), dpr=Math.max(1,Math.min(devicePixelRatio||1,2));
    canvas.width=Math.floor(r.width*dpr); canvas.height=Math.floor(r.height*dpr);
    canvas.style.width=r.width+'px'; canvas.style.height=r.height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0); draw();
  }

  function dataSlice(){
    const end=Math.max(state.visible, state.candles.length-state.offset);
    const start=Math.max(0,end-state.visible); return {data:state.candles.slice(start,end),start,end};
  }
  function niceStep(range,target=10){const rough=range/target,pow=10**Math.floor(Math.log10(rough)),n=rough/pow;return (n<1.5?1:n<3?2.5:n<7?5:10)*pow}
  function draw(){
    const w=wrap.clientWidth,h=wrap.clientHeight; if(w<10||h<10)return;
    ctx.clearRect(0,0,w,h); ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const right=68, left=0, top=0, bottom=29, volumeH=Math.min(150,h*.18), priceBottom=h-bottom;
    const {data,start}=dataSlice(); if(!data.length)return;
    const min=Math.min(...data.map(d=>d.low)),max=Math.max(...data.map(d=>d.high));
    const pad=(max-min)*.07, pmin=min-pad,pmax=max+pad;
    const y=p=>top+(pmax-p)/(pmax-pmin)*(priceBottom-top);
    const x=i=>left+(i+.5)/(data.length)*(w-right-left);
    // grid
    ctx.strokeStyle='#eeeeee';ctx.lineWidth=1;
    const step=niceStep(pmax-pmin,11), first=Math.ceil(pmin/step)*step;
    ctx.font='12px -apple-system,BlinkMacSystemFont,Segoe UI,Arial';ctx.textBaseline='middle';
    for(let p=first;p<=pmax;p+=step){const yy=y(p);ctx.beginPath();ctx.moveTo(left,yy+.5);ctx.lineTo(w-right,yy+.5);ctx.stroke();ctx.fillStyle='#333';ctx.fillText(fmt(p),w-right+9,yy)}
    const monthMarks=[];let lastM=-1;
    data.forEach((d,i)=>{const m=d.time.getUTCMonth(); if(m!==lastM){monthMarks.push([i,d.time]);lastM=m}});
    monthMarks.forEach(([i,d])=>{const xx=x(i);ctx.beginPath();ctx.moveTo(xx+.5,top);ctx.lineTo(xx+.5,priceBottom);ctx.stroke();ctx.fillStyle='#333';const mon=d.toLocaleString('id-ID',{month:'short',timeZone:'UTC'});ctx.fillText(d.getUTCMonth()===0?String(d.getUTCFullYear()):mon,xx-10,h-15)});
    // candles & volume
    const cw=Math.max(2,Math.min(8,(w-right)/data.length*.62)); const vmax=Math.max(...data.map(d=>d.volume))*1.15;
    data.forEach((d,i)=>{const xx=x(i), up=d.close>=d.open, c=up?'#089981':'#f23645';ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.round(xx)+.5,y(d.high));ctx.lineTo(Math.round(xx)+.5,y(d.low));ctx.stroke();const yo=y(d.open),yc=y(d.close),bh=Math.max(1,Math.abs(yc-yo));ctx.fillRect(xx-cw/2,Math.min(yo,yc),cw,bh);ctx.globalAlpha=.47;const vh=d.volume/vmax*volumeH;ctx.fillRect(xx-cw/2,priceBottom-vh,cw,vh);ctx.globalAlpha=1});
    // current price line
    const last=data[data.length-1], ly=y(last.close);ctx.save();ctx.strokeStyle='#f23645';ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(left,ly+.5);ctx.lineTo(w-right,ly+.5);ctx.stroke();ctx.restore();ctx.fillStyle='#f23645';ctx.fillRect(w-right,ly-18,68,36);ctx.fillStyle='#fff';ctx.font='12px -apple-system,BlinkMacSystemFont,Segoe UI,Arial';ctx.fillText(fmt(last.close),w-right+7,ly-7);ctx.fillText('03:26:55',w-right+7,ly+8);
    // right divider
    ctx.strokeStyle='#e8e8e8';ctx.beginPath();ctx.moveTo(w-right+.5,0);ctx.lineTo(w-right+.5,h);ctx.stroke();
    // crosshair
    if(state.hover){const mx=state.hover.x,my=state.hover.y;ctx.save();ctx.strokeStyle='#9aa0a6';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx,priceBottom);ctx.moveTo(0,my);ctx.lineTo(w-right,my);ctx.stroke();ctx.restore();const price=pmax-(my-top)/(priceBottom-top)*(pmax-pmin);ctx.fillStyle='#666';ctx.fillRect(w-right,my-10,68,20);ctx.fillStyle='#fff';ctx.fillText(fmt(price),w-right+7,my);const idx=Math.max(0,Math.min(data.length-1,Math.floor(mx/(w-right)*data.length)));const d=data[idx];if(d){updateLegend(d);ctx.fillStyle='#666';ctx.fillRect(Math.max(0,mx-42),h-bottom,84,bottom);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(d.time.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'2-digit'}),mx,h-15);ctx.textAlign='left'}} else updateLegend(state.candles.at(-1));
  }

  function updateLegend(d){
    if(!d)return; const delta=d.close-d.open,pct=delta/d.open*100,sg=delta>=0?'+':'−';
    $('#ohlc').textContent=`O${fmt(d.open)} H${fmt(d.high)} L${fmt(d.low)} C${fmt(d.close)} ${sg}${fmt(Math.abs(delta))} (${sg}${Math.abs(pct).toFixed(2).replace('.',',')}%)`;
    $('#ohlc').style.color=delta>=0?'#089981':'#f23645'; $('#sellPrice').textContent=fmt(d.close+6);$('#buyPrice').textContent=fmt(d.close+7);$('#volLabel').textContent=fmt1(d.volume/1000)+'K';
    $('#watchLast').textContent=fmt(d.close);$('#assetPrice').textContent=fmt(d.close);$('#statVolume').textContent=fmt1(d.volume/1000)+'K';
  }

  canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();state.hover={x:e.clientX-r.left,y:e.clientY-r.top}; if(state.dragging){const dx=e.clientX-state.dragX;if(Math.abs(dx)>7){state.offset=Math.max(0,Math.min(state.candles.length-state.visible,state.offset+Math.sign(-dx)*2));state.dragX=e.clientX}} draw()});
  canvas.addEventListener('mouseleave',()=>{state.hover=null;state.dragging=false;draw()});
  canvas.addEventListener('mousedown',e=>{state.dragging=true;state.dragX=e.clientX});window.addEventListener('mouseup',()=>state.dragging=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();state.visible=Math.max(35,Math.min(state.candles.length,state.visible+Math.sign(e.deltaY)*10));state.offset=Math.min(state.offset,state.candles.length-state.visible);draw()},{passive:false});

  function showToast(text){const t=$('#toast');t.textContent=text;t.classList.remove('hidden');clearTimeout(showToast._id);showToast._id=setTimeout(()=>t.classList.add('hidden'),1600)}
  function closeModal(){const root=$('#modalRoot');root.innerHTML=''}
  function modalShell(title,body,{compact=false,wide=false,footer=true}={}){
    $('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal ${compact?'compact':''} ${wide?'wide':''}"><div class="modal-title"><span>${title}</span><button class="modal-close" data-close>×</button></div><div class="modal-body">${body}</div>${footer?'<div class="modal-footer"><button class="btn" data-close>Batal</button><button class="btn primary" data-close>Ok</button></div>':''}</div></div>`;
    $$('[data-close]').forEach(b=>b.addEventListener('click',closeModal));$('.modal-backdrop').addEventListener('mousedown',e=>{if(e.target===e.currentTarget)closeModal()});
  }
  const symbolBody=`<input class="search-input" autofocus value="BTCUSD" aria-label="Cari simbol"><div class="symbol-list"><div class="symbol-item"><i>₿</i><div><strong>BTCUSD</strong><div class="hint" style="text-align:left;margin:2px 0">Bitcoin / Dollar AS · BITSTAMP</div></div><span>Crypto</span></div><div class="symbol-item"><i style="background:#627eea">Ξ</i><div><strong>ETHUSD</strong><div class="hint" style="text-align:left;margin:2px 0">Ethereum / Dollar AS</div></div><span>Crypto</span></div><div class="symbol-item"><i style="background:#d7a900">●</i><div><strong>GOLD</strong><div class="hint" style="text-align:left;margin:2px 0">Gold Spot</div></div><span>Futures</span></div></div>`;
  function openModal(name){
    if(name==='symbol'||name==='search') modalShell(name==='search'?'Pencarian cepat':'Pencarian simbol',symbolBody,{wide:true,footer:false});
    else if(name==='interval') modalShell('Ubah interval','<input class="interval-input" value="D" autofocus><div class="hint">1 hari</div>',{compact:true,footer:false});
    else if(name==='charttype') modalShell('Tipe chart','<div class="symbol-list"><div class="symbol-item">▥ <strong>Candle</strong></div><div class="symbol-item">│ <strong>Bar</strong></div><div class="symbol-item">╲ <strong>Garis</strong></div><div class="symbol-item">▰ <strong>Area</strong></div><div class="symbol-item">◇ <strong>Heikin Ashi</strong></div></div>',{compact:true,footer:false});
    else if(name==='indicator') modalShell('Indikator, metrik dan strategi','<input class="search-input" placeholder="Cari indikator"><div class="symbol-list"><div class="symbol-item"><span>MA</span><strong>Moving Average</strong><span>Teknikal</span></div><div class="symbol-item"><span>RSI</span><strong>Relative Strength Index</strong><span>Teknikal</span></div><div class="symbol-item"><span>MACD</span><strong>MACD</strong><span>Teknikal</span></div></div>',{wide:true,footer:false});
    else if(name==='alert') modalShell('Buat peringatan','<label>BTCUSD<br><select class="search-input" style="height:40px;margin-top:7px"><option>Melewati</option><option>Lebih besar dari</option><option>Lebih kecil dari</option></select></label><div class="setting-row"><label>Nilai</label><input class="interval-input" style="height:38px" value="82.000"></div>',{compact:false});
    else if(name==='settings') modalShell('Pengaturan',`<div class="settings-grid"><div class="settings-nav"><button class="active">⌇ Simbol</button><button>☰ Baris status</button><button>⌖ Skala dan garis</button><button>◇ Canvas</button><button>⌁ Trading</button><button>◴ Peringatan</button><button>▣ Peristiwa</button></div><div class="settings-content"><small style="color:#777">CANDLE</small><div class="setting-row"><input type="checkbox"> Warnai bar berdasarkan penutupan sebelumnya</div><div class="setting-row"><input type="checkbox" checked> <label>Badan</label><span class="swatch"><span style="background:#089981"></span></span><span class="swatch"><span style="background:#f23645"></span></span></div><div class="setting-row"><input type="checkbox" checked> <label>Batas-Batas</label><span class="swatch"><span style="background:#089981"></span></span><span class="swatch"><span style="background:#f23645"></span></span></div><div class="setting-row"><input type="checkbox" checked> <label>Sumbu</label><span class="swatch"><span style="background:#089981"></span></span><span class="swatch"><span style="background:#f23645"></span></span></div><small style="color:#777">MODIFIKASI DATA</small><div class="setting-row"><label>Presisi</label><select class="btn"><option>Bawaan</option></select></div><div class="setting-row"><label>Zona waktu</label><select class="btn"><option>(UTC+7) Bangkok</option></select></div></div></div>`,{wide:true});
    else if(name==='layout') modalShell('Setup layout','<div class="symbol-list"><div class="symbol-item">▣ <strong>1 chart</strong></div><div class="symbol-item">▦ <strong>2 chart</strong></div><div class="symbol-item">▦ <strong>4 chart</strong></div></div>',{compact:true,footer:false});
    else if(name==='publish') modalShell('Publikasikan ide','<p>Bagikan snapshot chart dan catatan analisis Anda.</p><textarea class="search-input" style="height:120px;padding-top:10px" placeholder="Tulis ide..."></textarea>',{wide:true});
    else if(name==='date') modalShell('Ke tanggal','<input class="search-input" type="date" value="2026-05-12">',{compact:true});
  }

  $$('[data-modal]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.modal)));
  $$('[data-tool]').forEach(b=>b.addEventListener('click',()=>{ $$('.rail-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.activeTool=b.dataset.tool;showToast('Peralatan: '+b.title)}));
  $$('[data-range]').forEach(b=>b.addEventListener('click',()=>{ $$('.rangebar [data-range]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const map={D:128,'1D':45,'5H':60,'1M':75,'3M':100,'6M':128,YTD:150,'1Y':170,'5Y':185,ALL:190};state.visible=Math.min(state.candles.length,map[b.dataset.range]||128);state.offset=0;draw()}));
  $$('[data-action]').forEach(b=>b.addEventListener('click',()=>{
    const a=b.dataset.action;
    if(a==='toast')showToast(b.dataset.toast||'Siap');
    if(a==='save'){localStorage.setItem('copytolive-chart-layout',JSON.stringify({visible:state.visible,offset:state.offset}));showToast('Layout disimpan')}
    if(a==='fullscreen'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()}
    if(a==='snapshot'){const url=canvas.toDataURL('image/png');const link=document.createElement('a');link.href=url;link.download='copytolive-btcusd-chart.png';link.click();showToast('Cuplikan chart diunduh')}
    if(a==='trade')$('#tradePanel').classList.toggle('hidden');
    if(a==='toggleWatch')$('#watchlist').classList.toggle('collapsed');
    if(a==='magnet'){state.magnet=!state.magnet;b.classList.toggle('active',state.magnet);showToast('Magnet '+(state.magnet?'aktif':'nonaktif'))}
    if(a==='lock'||a==='lockall'){state.locked=!state.locked;b.classList.toggle('active',state.locked);showToast('Gambar '+(state.locked?'dikunci':'dibuka'))}
    if(a==='hide'){state.hiddenDrawings=!state.hiddenDrawings;b.classList.toggle('active',state.hiddenDrawings);showToast('Gambar '+(state.hiddenDrawings?'disembunyikan':'ditampilkan'))}
    if(a==='clear')showToast('Semua gambar dihapus');
    if(a==='zoom'){state.visible=Math.max(35,state.visible-15);draw()}
    if(a==='replay'){state.replay=!state.replay;if(state.replay){state.visible=75;state.offset=state.candles.length-105;showToast('Putar ulang bar aktif');const id=setInterval(()=>{if(!state.replay){clearInterval(id);return}state.offset=Math.max(0,state.offset-1);draw();if(state.offset===0){state.replay=false;clearInterval(id);showToast('Putar ulang selesai')}},300)}else showToast('Putar ulang dijeda')}
  }));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();openModal('search')}});
  const saved=localStorage.getItem('copytolive-chart-layout');if(saved){try{Object.assign(state,JSON.parse(saved))}catch{}}
  setInterval(()=>{$('#clock').textContent=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date())+' UTC+7'},1000);
  new ResizeObserver(resize).observe(wrap);resize();
})();
