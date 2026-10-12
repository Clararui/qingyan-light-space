import { CONFIG } from './config.js';
import { createWorld } from './scene.js';

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(pointer: fine)');
const chapters=$$('.chapter'),overlays=$$('.chapter-sticky'),nav=$$('.masthead nav a');
const ui={progress:0,world:null,ready:false,lightX:.65,lightY:.4};
let offsets=[],scrollRAF=0,currentChapter=-1;
let entranceTimeline;
function measure(){offsets=chapters.map(el=>el.offsetTop);updateScroll();}
function scrollProgress(){const y=window.scrollY;for(let i=0;i<3;i++){if(y<offsets[i+1])return i+(y-offsets[i])/(offsets[i+1]-offsets[i]);}return 3;}
function updateScroll(){scrollRAF=0;ui.progress=Math.max(0,Math.min(3,scrollProgress()));ui.world?.setProgress(ui.progress);if(!ui.world)updateUI(ui.progress,0,0);}
function updateUI(p,x,y){
  document.documentElement.style.setProperty('--light-x',`${50+x*30}%`);document.documentElement.style.setProperty('--light-y',`${50+y*30}%`);
  $('.back-word-hero').style.opacity=String(Math.max(0,1-p*2));
  $('.back-word-hero').style.transform=`translate(-50%,-50%) translate(${x*-12}px,${y*-8}px)`;
  $('.back-word-final').style.opacity=String(Math.max(0,(p-2.5)*.5));
  overlays.forEach((el,i)=>{let opacity=Math.max(0,1-Math.abs(p-i)*2.0);if(i===0)opacity=Math.max(0,1-p*2.8);if(i===3)opacity=Math.min(1,Math.max(0,(p-2.35)*2));el.style.opacity=String(opacity);el.style.visibility=opacity<.01?'hidden':'visible';el.inert=opacity<.1;});
  $('.chapter-progress span').style.width=`${p/3*100}%`;
  const chapter=Math.max(0,Math.min(3,Math.round(p)));
  if(chapter!==currentChapter){if(chapter===3&&!reduced.matches)gsap.fromTo('.finale-overlay h2',{backgroundPosition:'150% 0%'},{backgroundPosition:'0% 0%',duration:2.8,ease:'power2.out'});currentChapter=chapter;nav.forEach((a,i)=>{a.classList.toggle('active',i===chapter);if(i===chapter)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});$('.frame-number').textContent=`0${chapter+1} / 04`;}
  $('.ambient-pink').style.opacity=String(.32+Math.sin(p*Math.PI/3)*.25);
  $('.ambient-violet').style.opacity=String(.30+p*.06);
}
function playEntrance(){
  entranceTimeline?.kill();
  if(reduced.matches){gsap.set('.title-mask>span, .hero-copy .eyebrow, .short-line, .hero-note, .scroll-cue, .hero-mark',{clearProps:'all'});return;}
  entranceTimeline=gsap.timeline();
  entranceTimeline.fromTo('.hero-copy .eyebrow',{opacity:0,x:-12},{opacity:1,x:0,duration:.8,ease:'power2.out'},1.5)
    .fromTo('.title-mask>span',{yPercent:115,rotate:3},{yPercent:0,rotate:0,duration:1.35,stagger:.17,ease:'power3.out'},1.7)
    .fromTo('.short-line',{opacity:0,x:-12},{opacity:1,x:0,duration:.9,ease:'power2.out'},2.3)
    .fromTo('.hero-note, .hero-mark, .scroll-cue',{opacity:0},{opacity:1,duration:1,stagger:.12},2.4);
}
CONFIG.portraits.forEach((p,i)=>{const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`聚焦人像：${p.title}`);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>ui.world?.focus(i));$('.gallery-access').append(b);});
document.addEventListener('galleryfocus',e=>{$$('.gallery-access button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===e.detail)));});
$('#shutter').addEventListener('click',()=>{
  if(!ui.world?.capture())return;
  if(!reduced.matches){
    gsap.killTweensOf('.flash, .aperture-wave');gsap.fromTo('.flash',{opacity:.70},{opacity:0,duration:.48,ease:'power2.out'});
    gsap.fromTo('.aperture-wave',{scale:.2,opacity:.75},{scale:11,opacity:0,duration:1.05,ease:'power2.out'});
    gsap.fromTo('.shutter',{scale:.90},{scale:1,duration:.65,ease:'elastic.out(1,.35)'});
  }
});
$('#replay').addEventListener('click',()=>{
  history.replaceState(null,'','#top');window.scrollTo({top:0,behavior:'instant'});ui.progress=0;ui.world?.replay();updateScroll();playEntrance();nav[0].focus({preventScroll:true});
});
$$('.magnetic').forEach(button=>{
  button.addEventListener('pointermove',e=>{if(reduced.matches||!fine.matches||e.pointerType==='touch')return;const r=button.getBoundingClientRect();gsap.to(button,{x:(e.clientX-r.left-r.width/2)*.18,y:(e.clientY-r.top-r.height/2)*.18,duration:.4,ease:'power2.out'});});
  button.addEventListener('pointerleave',()=>gsap.to(button,{x:0,y:0,duration:.65,ease:reduced.matches?'none':'elastic.out(1,.45)'}));
});
const trails=$$('.light-trails i');let pointerRAF=0,targetX=innerWidth*.65,targetY=innerHeight*.4,lastMove=0,trailPositions=trails.map(()=>({x:targetX,y:targetY}));
function pointerTick(now){
  pointerRAF=0;if(document.hidden||reduced.matches||!fine.matches)return;
  trailPositions.forEach((point,i)=>{const previous=i===0?{x:targetX,y:targetY}:trailPositions[i-1];point.x+=(previous.x-point.x)*(i===0?.15:.12);point.y+=(previous.y-point.y)*(i===0?.15:.12);trails[i].style.left=`${point.x}px`;trails[i].style.top=`${point.y}px`;trails[i].style.opacity=String(Math.max(0,1-(now-lastMove)/450)*(1-i*.22));});
  if(now-lastMove<550)pointerRAF=requestAnimationFrame(pointerTick);
}
addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;targetX=e.clientX;targetY=e.clientY;lastMove=performance.now();if(!pointerRAF&&!reduced.matches&&fine.matches)pointerRAF=requestAnimationFrame(pointerTick);},{passive:true});
addEventListener('scroll',()=>{if(!scrollRAF)scrollRAF=requestAnimationFrame(updateScroll);},{passive:true});
addEventListener('resize',measure,{passive:true});
reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(pointerRAF);pointerRAF=0;trails.forEach(el=>el.style.opacity='0');entranceTimeline?.progress(1);}updateScroll();});
measure();
if(window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);ScrollTrigger.create({trigger:'#experience',start:'top top',end:()=>`${offsets[3]} top`,onUpdate:updateScroll,onRefresh:measure});}
createWorld({
  onProgress:updateUI,
  onReady:()=>{ui.ready=true;$('#loading').classList.add('done');$('#loading').hidden=true;$('#shutter').disabled=false;$('.shot-count').textContent='00 / 06';playEntrance();},
  onShot:(n,count)=>{$('.shot-count').textContent=`${String(count).padStart(2,'0')} / 06`;$('.shot-count').setAttribute('aria-label',n===0?'准备拍摄':`已拍摄 ${n} 次，空间中有 ${count} 张照片`);},
  onError:error=>{document.body.classList.add('no-webgl');$('#loading').textContent='光场暂时不可用，请尝试刷新';$('#shutter').disabled=true;console.warn(error.message);},
}).then(world=>{ui.world=world;updateScroll();});
// Read-only diagnostics for local verification, no network or analytics.
window.QINGYAN={stats:()=>ui.world?.stats()??{webgl:false},version:'light-space-2'};
