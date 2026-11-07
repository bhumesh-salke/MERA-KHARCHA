const http = require('http');
const fs = require('fs');

function loadData() {
  try {
    return JSON.parse(fs.readFileSync('kharcha.json', 'utf8'));
  } catch (e) {
    return [];
  }
}
function saveData(data) {
  fs.writeFileSync('kharcha.json', JSON.stringify(data));
}
let kharche = loadData();
let nextId = kharche.length ? Math.max(...kharche.map((k) => k.id)) + 1 : 1;

const server = http.createServer((req, res) => {
  if (req.url === '/api/kharcha' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(kharche));
    return;
  }
  if (req.url === '/api/kharcha' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const d = JSON.parse(body);
      kharche.push({
        id: nextId++,
        naam: d.naam,
        paisa: Number(d.paisa),
        category: d.category || 'Other',
        date: d.date || new Date().toISOString().slice(0, 10),
      });
      saveData(kharche);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(kharche));
    });
    return;
  }
  if (req.url.startsWith('/api/kharcha/') && req.method === 'DELETE') {
    const id = parseInt(req.url.split('/')[3]);
    kharche = kharche.filter((k) => k.id !== id);
    saveData(kharche);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(kharche));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',Arial; background:linear-gradient(135deg,#667eea,#764ba2); min-height:100vh; margin:0; display:flex; justify-content:center; padding:20px 10px}
      .box{background:#fff; width:100%; max-width:420px; border-radius:20px; padding:22px; box-shadow:0 15px 35px rgba(0,0,0,0.25)}
      .header{text-align:center; margin-bottom:15px}
      .header h1{margin:0; font-size:26px; color:#333}
      .header p{margin:5px 0 0; color:#888; font-size:13px}
      .total-card{background:linear-gradient(135deg,#11998e,#38ef7d); color:white; padding:18px; border-radius:16px; text-align:center}
      .total-card small{opacity:0.9; font-size:13px}
      .total-card div{font-size:32px; font-weight:800; margin-top:2px}
      .card{background:#f7f7ff; border:1px solid #eee; border-radius:16px; padding:14px; margin-top:14px}
      .card h3{margin:0 0 10px; font-size:15px; color:#444}
      input,select{width:100%; padding:12px; margin:6px 0; border:1.5px solid #e0e0e0; border-radius:10px; font-size:14px; outline:none; background:white}
      input:focus,select:focus{border-color:#667eea}
      .row{display:flex; gap:8px}
      .row > *{flex:1}
      .add-btn{width:100%; padding:13px; background:#667eea; color:white; border:none; border-radius:12px; font-size:16px; font-weight:700; cursor:pointer; margin-top:8px}
      .add-btn:active{transform:scale(0.98)}
      .filter-row{display:flex; gap:6px; flex-wrap:wrap; margin:14px 0 5px}
      .chip{padding:7px 12px; border-radius:20px; border:1px solid #ddd; background:white; cursor:pointer; font-size:13px}
      .chip.active{background:#333; color:white; border-color:#333}
      .item{display:flex; justify-content:space-between; align-items:center; background:white; border:1px solid #f0f0f0; padding:12px; border-radius:14px; margin:8px 0; box-shadow:0 2px 8px rgba(0,0,0,0.04)}
      .item b{font-size:15px; color:#222}
      .item small{color:#888}
      .badge{font-size:11px; padding:4px 9px; border-radius:20px; font-weight:700}
      .Chai{background:#fff3cd; color:#856404} .Khana{background:#ffe0d6; color:#c0392b} .Petrol{background:#e0e7ff; color:#3730a3} .Kirana{background:#d1fae5; color:#065f46} .Other{background:#f3f4f6; color:#374151}
      .price{font-weight:800; font-size:16px}
      .del{border:none; background:#ffecec; color:#e11d48; width:32px; height:32px; border-radius:50%; cursor:pointer; font-weight:800; margin-left:10px}
      .empty{text-align:center; color:#aaa; padding:20px; font-size:14px}
    </style>
    <div class="box">
      <div class="header"><h1>Mera Kharcha</h1><p>Apna hisab, apne haath me</p></div>
      <div class="total-card"><small id="total-label">TOTAL KHARCHA</small><div id="total">Rs. 0</div></div>

      <div class="card">
        <h3>Naya Kharcha Jodo</h3>
        <input id="naam" placeholder="Kya kharida?  Parle G, Chai..." />
        <div class="row"><input id="paisa" type="number" placeholder="Kitne Rs.?" /><input id="date" type="date" /></div>
        <select id="category"><option>Chai</option><option>Khana</option><option>Petrol</option><option>Kirana</option><option>Other</option></select>
        <button class="add-btn" onclick="addKarcha()">+ Add Karo</button>
      </div>

      <div class="filter-row" id="chips">
        <button class="chip active" onclick="setFilter('All',this)">Sab</button>
        <button class="chip" onclick="setFilter('Chai',this)">Chai</button>
        <button class="chip" onclick="setFilter('Khana',this)">Khana</button>
        <button class="chip" onclick="setFilter('Petrol',this)">Petrol</button>
        <button class="chip" onclick="setFilter('Kirana',this)">Kirana</button>
        <button class="chip" onclick="setFilter('Other',this)">Other</button>
      </div>
      <div id="list"></div>
    </div>
    <script>
      let allData=[]; let curFilter='All';
      const icons={Chai:'☕',Khana:'🍔',Petrol:'⛽',Kirana:'🛒',Other:'📦'};
      function setFilter(f,el){curFilter=f; document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); load();}
      async function load(){
        let r=await fetch('/api/kharcha'); allData=await r.json();
        let show = curFilter==='All' ? allData : allData.filter(k=>(k.category||'Other')===curFilter);
        let total=show.reduce((s,k)=>s+k.paisa,0);
        document.getElementById('total').innerText='Rs. '+total;
        document.getElementById('total-label').innerText = curFilter==='All' ? 'TOTAL KHARCHA' : curFilter.toUpperCase() + ' KA TOTAL';
        if(!show.length){ document.getElementById('list').innerHTML='<div class="empty">Abhi koi kharcha nahi hai.<br>Upar se add karo.</div>'; return; }
        document.getElementById('list').innerHTML=show.slice().reverse().map(k=>'<div class="item"><div><b>'+(icons[k.category||'Other']||'📦')+' '+k.naam+'</b><br><small>'+(k.date||'')+'</small> <span class="badge '+(k.category||'Other')+'">'+(k.category||'Other')+'</span></div><div style="display:flex; align-items:center"><span class="price">Rs. '+k.paisa+'</span><button class="del" onclick="delKarcha('+k.id+')">x</button></div></div>').join('');
      }
      async function addKarcha(){
        let naam=document.getElementById('naam').value;
        let paisa=document.getElementById('paisa').value;
        let category=document.getElementById('category').value;
        let date=document.getElementById('date').value;
        if(!naam||!paisa) return alert('Naam aur Paisa dono likho');
        await fetch('/api/kharcha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({naam,paisa,category,date})});
        document.getElementById('naam').value='';document.getElementById('paisa').value='';
        load();
      }
      async function delKarcha(id){await fetch('/api/kharcha/'+id,{method:'DELETE'});load();}
      document.getElementById('date').value = new Date().toISOString().slice(0,10);
      load();
    </script>
  `);
});
server.listen(3000, () => console.log('Server chal raha hai'));
