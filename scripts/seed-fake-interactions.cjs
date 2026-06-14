#!/usr/bin/env node
/*
 * Gera dados de teste fictícios (ads + interações) para o KANDU (Copy) em chunks
 * de <=100 registos, prontos a enviar via MCP create_entities.
 * NÃO cria utilizadores (feitos pelo builder do Base44).
 * Todos os registos levam fake_test:true para limpeza posterior.
 *
 * Fase 1 (jobs):   node scripts/seed-fake-interactions.cjs phase1
 *   Lê:  scripts/fakeusers.json  { workers:[{id,city}], employers:[{id,city}] }
 *   Escreve: scripts/out/Job_*.json
 *
 * Fase 2 (resto):  node scripts/seed-fake-interactions.cjs phase2
 *   Lê:  scripts/fakeusers.json  e  scripts/fakejobs.json [{id,employer_id,status,title}]
 *   Escreve: scripts/out/Application_*.json, ChatMessage_*.json, Rating_*.json, Notification_*.json
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out');
const mode = process.argv[2] || 'phase1';

const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'fakeusers.json'), 'utf8'));
const workers = users.workers, employers = users.employers;
if (!workers.length || !employers.length) throw new Error('fakeusers.json vazio');

const CATEGORIES = ['Mão de Obra','Pintura','Eletricidade','Canalização','Alvenaria','Ladrilhador','Carpintaria','Climatização','Isolamentos','Pavimentos','Telhados'];
const CITIES = {'Lisboa':[38.7223,-9.1393],'Porto':[41.1579,-8.6291],'Braga':[41.5454,-8.4265],'Coimbra':[40.2033,-8.4103],'Faro':[37.0194,-7.9304],'Aveiro':[40.6405,-8.6538],'Setúbal':[38.5244,-8.8882],'Funchal':[32.6669,-16.9241],'Évora':[38.5714,-7.9135],'Leiria':[39.7436,-8.8071]};
const CITY_NAMES = Object.keys(CITIES);
const PRICE_TYPES = ['hourly','fixed','negotiable'];
const URGENCY = ['low','medium','high'];
const STATUSES = ['open','open','open','open','in_progress','in_progress','completed','completed','cancelled'];
const TITLES = {'Pintura':['Pintar apartamento T2','Pintura de fachada','Repintar quarto','Pintura de escritório'],'Eletricidade':['Instalação de quadro elétrico','Reparar tomadas','Instalar iluminação LED','Revisão elétrica'],'Canalização':['Reparar fuga de água','Instalar autoclismo','Substituir canos','Desentupir esgoto'],'Alvenaria':['Levantar parede de tijolo','Reboco de parede','Construir muro','Reparar reboco'],'Ladrilhador':['Assentar azulejos','Ladrilhar casa de banho','Colocar mosaico','Reparar ladrilhos'],'Carpintaria':['Montar roupeiro','Reparar portas','Estante por medida','Instalar rodapés'],'Climatização':['Instalar ar condicionado','Manutenção de AC','Reparar bomba de calor','Instalar ventilação'],'Isolamentos':['Isolamento de sótão','Isolar parede exterior','Isolamento acústico','Aplicar capoto'],'Pavimentos':['Pavimento flutuante','Polir soalho','Instalar vinílico','Nivelar piso'],'Telhados':['Reparar telhado','Substituir telhas','Impermeabilizar terraço','Limpeza de caleiras'],'Mão de Obra':['Ajudante de obra','Carga e descarga','Demolição ligeira','Limpeza pós-obra']};
const DESCRIPTIONS = ['Serviço urgente, materiais por conta do profissional.','Orçamento prévio. Disponível ao fim de semana.','Pequena dimensão, ideal para começar já.','Prazo de 2 semanas, pagamento por fases.','Procuro profissional com experiência e referências.','Materiais comprados, falta a mão de obra.'];
const APP_MESSAGES = ['Tenho disponibilidade imediata e experiência.','Posso passar para ver a obra esta semana.','Faço orçamento sem compromisso.','Tenho ferramentas próprias e portfólio.','Interessado! Combinamos os detalhes?'];
const CHAT_OPENERS = ['Olá! Vi o anúncio, ainda está disponível?','Bom dia, posso ajudar. Quando precisa?','Tenho interesse na obra, pode dar detalhes?','Qual a morada exata da obra?'];
const CHAT_REPLIES = ['Sim, disponível. Qual o seu valor?','Combinado, marcamos para amanhã.','Perfeito, envio a morada.','Obrigado, vou analisar a proposta.'];
const RATING_COMMENTS = ['Excelente trabalho, recomendo!','Profissional e pontual.','Correu tudo bem, voltaria a contratar.','Bom serviço, dentro do prazo.','Comunicação clara, trabalho limpo.'];
const QUALITIES = ['Pontualidade','Qualidade','Comunicação','Limpeza','Profissionalismo'];

const pick = a => a[Math.floor(Math.random()*a.length)];
const ri = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;
const jit = v => v + (Math.random()-0.5)*0.08;

function writeChunks(name, arr){
  if (!arr.length){ console.log(`${name}: 0`); return; }
  let n=0;
  for (let i=0;i<arr.length;i+=100){ n++; fs.writeFileSync(path.join(OUT,`${name}_${n}.json`), JSON.stringify(arr.slice(i,i+100))); }
  console.log(`${name}: ${arr.length} em ${n} chunk(s)`);
}

if (mode === 'phase1'){
  fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
  const jobs = [];
  for (let i=0;i<150;i++){
    const emp = pick(employers);
    const cat = pick(CATEGORIES);
    const city = (emp.city && CITIES[emp.city]) ? emp.city : pick(CITY_NAMES);
    const [lat,lng] = CITIES[city];
    const pt = pick(PRICE_TYPES);
    jobs.push({ title:`[FAKE] ${pick(TITLES[cat])}`, category:cat, description:pick(DESCRIPTIONS),
      location:city, latitude:jit(lat), longitude:jit(lng), price_type:pt,
      price: pt==='hourly'?ri(10,35):ri(80,2500), status:pick(STATUSES), urgency:pick(URGENCY),
      views:ri(0,300), employer_id:emp.id, fake_test:true });
  }
  writeChunks('Job', jobs);
  console.log('FASE 1 pronta. Criar Jobs via MCP, depois popular scripts/fakejobs.json e correr phase2.');
  process.exit(0);
}

// ---- FASE 2 ----
const jobs = JSON.parse(fs.readFileSync(path.join(__dirname,'fakejobs.json'),'utf8'));
if (!jobs.length) throw new Error('fakejobs.json vazio');

const applications = [];
const jobApplicants = {};
for (const job of jobs){
  const n = ri(2,4); const chosen = new Set();
  for (let k=0;k<n;k++){ let w=pick(workers),g=0; while(chosen.has(w.id)&&g++<10) w=pick(workers); chosen.add(w.id);
    const prop = Math.random()<0.5;
    applications.push({ job_id:job.id, worker_id:w.id, message:pick(APP_MESSAGES),
      application_type: prop?'proposal':'application', ...(prop?{proposed_price:ri(50,2000)}:{}),
      status: job.status==='open'?'pending':pick(['accepted','rejected','pending']), fake_test:true });
  }
  jobApplicants[job.id] = [...chosen];
}

const messages = [];
const cid = (a,b)=>[a,b].sort().join('__');
function convo(empId, wId, n){ let s=wId,r=empId; const c=cid(empId,wId);
  for(let m=0;m<n;m++){ messages.push({ conversation_id:c, sender_id:s, receiver_id:r,
    message: m===0?pick(CHAT_OPENERS):(m%2?pick(CHAT_REPLIES):pick(CHAT_OPENERS)),
    is_read: Math.random()<0.7, fake_test:true }); [s,r]=[r,s]; } }
for (const job of jobs){ for (const wId of (jobApplicants[job.id]||[]).slice(0, ri(1,2))) convo(job.employer_id, wId, ri(2,4)); }
for (let i=0;i<120;i++) convo(pick(employers).id, pick(workers).id, ri(2,3));

const ratings = [];
for (const job of jobs.filter(j=>j.status==='completed')){
  const wId = pick(jobApplicants[job.id]&&jobApplicants[job.id].length?jobApplicants[job.id]:[pick(workers).id]);
  ratings.push({ job_id:job.id, rater_id:job.employer_id, rated_id:wId, rating:ri(3,5), comment:pick(RATING_COMMENTS), qualities:[pick(QUALITIES),pick(QUALITIES)], is_visible:true, fake_test:true });
  ratings.push({ job_id:job.id, rater_id:wId, rated_id:job.employer_id, rating:ri(3,5), comment:pick(RATING_COMMENTS), qualities:[pick(QUALITIES)], is_visible:true, fake_test:true });
}

const notifications = [];
for (const app of applications.slice(0,150)){
  const job = jobs.find(j=>j.id===app.job_id);
  notifications.push({ user_id:job.employer_id, type: app.application_type==='proposal'?'new_proposal':'new_application',
    title:'Nova candidatura', message:`Recebeu uma ${app.application_type==='proposal'?'proposta':'candidatura'} para "${job.title}".`,
    related_id:job.id, is_read:Math.random()<0.5, fake_test:true });
}

writeChunks('Application', applications);
writeChunks('ChatMessage', messages);
writeChunks('Rating', ratings);
writeChunks('Notification', notifications);
console.log('FASE 2 pronta.');
