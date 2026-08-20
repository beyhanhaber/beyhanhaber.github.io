const $=s=>document.querySelector(s),api='/api';let news=[],categories=[],adminNews=[];
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=n=>n.createdAt?new Date(n.createdAt).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}):'YENİ';
const authHeaders=()=>({Authorization:'Bearer '+sessionStorage.getItem('beyhanToken')});

async function get(url,opt={}){
  const r=await fetch(api+url,opt);
  if(!r.ok)throw new Error((await r.json().catch(()=>({}))).message||'İşlem tamamlanamadı.');
  return r.status===204?null:r.json();
}

function card(n){
  return `<article class="news-card" data-id="${n._id}"><div class="image-wrap"><img class="card-image" src="${esc(n.imageUrl)}" alt="${esc(n.title)}"><span class="video-pill">▶ VİDEO</span></div><div class="news-meta"><span>${esc(n.category).toUpperCase()}</span><span>${date(n)}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></article>`;
}

function bindCards(root,items){
  root.innerHTML=items.map(card).join('')||'<p>Bu kategoride henüz haber yok.</p>';
  root.querySelectorAll('.news-card').forEach(x=>x.onclick=()=>story(items.find(n=>n._id===x.dataset.id)));
}

function draw(){
  const f=news[0];
  if(f){
    $('#featuredCard').innerHTML=`<img class="feature-image" src="${esc(f.imageUrl)}" alt=""><div class="featured-overlay"><span class="play">▶</span><p>${esc(f.category).toUpperCase()} · ${date(f)}</p><h3>${esc(f.title)}</h3></div>`;
    $('#featuredCard').onclick=()=>story(f);
  }
  bindCards($('#newsGrid'),news.slice(1,4));
}

function media(n){
  const u=n.videoUrl||'';
  if(n.platform==='direct')return `<video src="${esc(u)}" controls autoplay></video>`;
  if(n.platform==='youtube'){const id=(u.match(/(?:v=|youtu.be\/|embed\/)([^&?\s/]+)/)||[])[1];return id?`<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`:''}
  if(n.platform==='vimeo'){const id=(u.match(/vimeo\.com\/(\d+)/)||[])[1];return id?`<iframe src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe>`:''}
  if(n.platform==='instagram')return `<iframe src="${esc(u.replace(/\/$/,'')+'/embed/')}" allowfullscreen></iframe>`;
  if(n.platform==='facebook')return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}" allowfullscreen></iframe>`;
  if(n.platform==='x')return `<a class="source" href="${esc(u)}" target="_blank">X'te videoyu aç ↗</a>`;
  return '';
}

function story(n){
  const w=window.open('','_blank'),m=media(n)||`<img src="${esc(n.imageUrl)}" alt="">`;
  w.document.write(`<!doctype html><title>${esc(n.title)} | Beyhan Haber</title><style>body{margin:0;background:#f5f3ee;color:#101010;font-family:Arial}main{max-width:850px;margin:auto;padding:50px 24px}small{color:#e63723;font-weight:bold}h1{font:700 43px Georgia}p{font-size:17px;line-height:1.7;color:#444}iframe,video,img{width:100%;aspect-ratio:16/9;border:0;object-fit:cover;background:#111;margin:15px 0 25px}.source{display:inline-block;background:#101010;color:#fff;padding:15px;text-decoration:none;margin:20px 0}</style><main><small>${esc(n.category).toUpperCase()} · ${date(n)}</small><h1>${esc(n.title)}</h1>${m}<p>${esc(n.body)}</p></main>`);
  w.document.close();
}

async function load(){
  try{
    [news,categories]=await Promise.all([get('/news'),get('/categories')]);
    draw();
  }catch(e){
    $('#newsGrid').innerHTML='<p>Haberler yüklenemedi. Sunucunun çalıştığından emin olun.</p>';
  }
}

function renderAuth(){
  $('#dashboardView').hidden=true;
  $('#authView').hidden=false;
  $('#authView').innerHTML=`<p class="eyebrow">BEYHAN HABER CMS</p><h2>Yönetici girişi</h2><p class="form-intro">Yalnızca yetkili yönetici hesabı giriş yapabilir.</p><form id="authForm"><label>E-posta<input id="adminEmail" type="email" autocomplete="email" required></label><label>Şifre<input id="adminPassword" type="password" autocomplete="current-password" required></label><button class="publish-button">Giriş yap <span>→</span></button></form>`;
  $('#authForm').onsubmit=async e=>{
    e.preventDefault();
    try{
      const x=await get('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#adminEmail').value,password:$('#adminPassword').value})});
      sessionStorage.setItem('beyhanToken',x.token);
      dashboard();
    }catch(x){
      alert(x.message);
    }
  };
}

async function dashboard(){
  if(!sessionStorage.getItem('beyhanToken'))return renderAuth();
  try{
    adminNews=await get('/admin/news',{headers:authHeaders()});
    $('#authView').hidden=true;
    $('#dashboardView').hidden=false;
    populate();
    adminRender();
    tab('overview');
  }catch(e){
    sessionStorage.removeItem('beyhanToken');
    renderAuth();
  }
}

function populate(){
  $('#category').innerHTML=categories.map(c=>`<option>${esc(c.name)}</option>`).join('');
}

function adminRender(){
  $('#articleCount').textContent=adminNews.length;
  $('#categoryCount').textContent=categories.length;
  $('#publishedCount').textContent=adminNews.filter(n=>n.status==='published').length;
  $('#manageList').innerHTML=adminNews.map(n=>`<article class="manage-item"><div><small>${esc(n.category).toUpperCase()} · ${n.status==='draft'?'TASLAK':'YAYINDA'}</small><h4>${esc(n.title)}</h4></div><button class="delete-news" data-id="${n._id}">Sil</button></article>`).join('');
  $('#categoryList').innerHTML=categories.map(c=>`<span class="category-tag">${esc(c.name)} <button class="delete-category-btn" data-id="${c._id}">×</button></span>`).join('');
}

function tab(name){
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));
  document.querySelectorAll('.tab-content').forEach(x=>x.hidden=x.id!==name);
}

function openAdmin(){
  $('#adminModal').classList.add('open');
  dashboard();
}

// Mobil Menü Mantığı
const menuBtn = $('#menuButton');
const mainNav = $('header nav');
if(menuBtn && mainNav){
  menuBtn.onclick = () => mainNav.classList.toggle('active');
}

$('#closePanel').onclick=()=>$('#adminModal').classList.remove('open');
$('#adminModal').onclick=e=>{if(e.target.id==='adminModal')$('#adminModal').classList.remove('open')};
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='a'){e.preventDefault();openAdmin()}});
if(location.hash==='#yonetim')openAdmin();

// Genel Tıklama Dinleyicisi (Yetki ve Silme İşlemleri)
document.addEventListener('click',async e=>{
  if(e.target.classList.contains('tab'))tab(e.target.dataset.tab);
  if(e.target.classList.contains('quick-create'))tab('create');
  if(e.target.id==='logout'){sessionStorage.removeItem('beyhanToken');renderAuth()}
  
  if(e.target.classList.contains('delete-news')&&confirm('Bu haberi silmek istediğine emin misin?')){
    await get('/news/'+e.target.dataset.id,{method:'DELETE',headers:authHeaders()});
    await dashboard();
    await load();
  }
  
  // DÜZELTME: Sadece delete-category-btn sınıfına sahip butonlar için çalışır
  if(e.target.classList.contains('delete-category-btn')&&confirm('Kategoriyi silmek istediğine emin misin?')){
    await get('/categories/'+e.target.dataset.id,{method:'DELETE',headers:authHeaders()});
    categories=await get('/categories');
    populate();
    adminRender();
  }
});

$('#videoFile').onchange=e=>$('#fileName').textContent=e.target.files[0]?.name||'Video dosyası seç';
$('#imageFile').onchange=e=>$('#imageFileName').textContent=e.target.files[0]?.name||'Görsel dosyası seç';

$('#newsForm').onsubmit=async e=>{
  e.preventDefault();
  const d=new FormData(e.target);
  try{
    await get('/news',{method:'POST',headers:authHeaders(),body:d});
    e.target.reset();
    $('#fileName').textContent='Video dosyası seç';
    $('#imageFileName').textContent='Görsel dosyası seç';
    await load();
    await dashboard();
    tab('manage');
  }catch(x){alert(x.message)}
};

$('#categoryForm').onsubmit=async e=>{
  e.preventDefault();
  try{
    await get('/categories',{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({name:$('#newCategory').value})});
    categories=await get('/categories');
    populate();
    adminRender();
    e.target.reset();
  }catch(x){alert(x.message)}
};

// Menü Tıklamaları ve Kategori Filtreleme
document.querySelectorAll('nav a').forEach(a=>{
  a.onclick=async e=>{
    if(mainNav) mainNav.classList.remove('active'); // Mobilde tıklanınca menüyü kapat
    document.querySelectorAll('nav a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');

    if(a.dataset.category){
      e.preventDefault();
      const cat=a.dataset.category;
      try{
        const items=await get('/news?category='+encodeURIComponent(cat));
        $('#categoryEyebrow').textContent='KATEGORİ';
        $('#categoryTitle').textContent=cat;
        bindCards($('#categoryGrid'),items);
        $('#categoryView').hidden=false;
        $('#categoryView').scrollIntoView({behavior:'smooth'});
      }catch(err){
        console.error(err);
      }
    }else{
      $('#categoryView').hidden=true;
    }
  };
});

$('#closeCategory').onclick=()=>{
  $('#categoryView').hidden=true;
  document.querySelectorAll('nav a').forEach((x,i)=>x.classList.toggle('active',i===0));
  $('#latest').scrollIntoView({behavior:'smooth'});
};

$('#showAll').onclick=()=>bindCards($('#newsGrid'),news);
$('#year').textContent=new Date().getFullYear();
$('#liveDate').textContent=new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});

load();