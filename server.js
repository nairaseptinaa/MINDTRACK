// Server kecil MindTrack: menyajikan halaman + meneruskan chat ke Claude (API key aman di server).
const http=require('http'),fs=require('fs'),path=require('path');
try{fs.readFileSync(path.join(__dirname,'.env'),'utf8').split(/\r?\n/).forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')})}catch(e){}
const KEY=process.env.ANTHROPIC_API_KEY,MODEL=process.env.MODEL||'claude-sonnet-5-5',PORT=process.env.PORT||3000;
const FILES={'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/script.js':['script.js','text/javascript; charset=utf-8']};
const json=(res,c,o)=>{res.writeHead(c,{'content-type':'application/json'});res.end(JSON.stringify(o))};
http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','content-type');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
  if(req.method==='POST'&&req.url==='/api/chat'){
    try{
      if(!KEY)throw new Error('ANTHROPIC_API_KEY belum diisi di file .env');
      let b='';for await(const c of req)b+=c;
      const{system,messages}=JSON.parse(b);
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':KEY,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({model:MODEL,max_tokens:1000,system:String(system||'').slice(0,5000),messages:(messages||[]).slice(-20)})});
      const j=await r.json();if(!r.ok)throw new Error(j.error&&j.error.message||'Kesalahan API');
      return json(res,200,{text:j.content.filter(x=>x.type==='text').map(x=>x.text).join('')});
    }catch(e){return json(res,500,{error:e.message})}
  }
  const f=FILES[req.url.split('?')[0]];
  if(!f){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'content-type':f[1]});fs.createReadStream(path.join(__dirname,f[0])).pipe(res);
}).listen(PORT,()=>console.log('MindTrack jalan di http://localhost:'+PORT+(KEY?'':'  (API key belum diisi: bot memakai jawaban cadangan)')));
