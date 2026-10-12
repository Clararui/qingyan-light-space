import * as THREE from 'three';
import { CONFIG } from './config.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 600px)');
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const cover = (ctx, image, w, h) => {
  const scale = Math.max(w / image.width, h / image.height);
  ctx.drawImage(image, (w - image.width * scale) / 2, (h - image.height * scale) / 2, image.width * scale, image.height * scale);
};
function roundedShape(w, h, r) {
  const s = new THREE.Shape(), x = -w/2, y = -h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function solid(w,h,r,depth,material,bevel=.025) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w,h,r),{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:16,steps:1});
  geo.translate(0,0,-depth/2);const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function face(w,h,r,material) {
  const geo=new THREE.ShapeGeometry(roundedShape(w,h,r),16),pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+w/2)/w,(pos.getY(i)+h/2)/h);
  return new THREE.Mesh(geo,material);
}
function portraitTexture(image, ratio=.7) {
  const c=document.createElement('canvas');c.height=mobile.matches?768:1152;c.width=Math.round(c.height*ratio);
  cover(c.getContext('2d'),image,c.width,c.height);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
}
function silver(color=0xd7d9e3) {
  return new THREE.MeshPhysicalMaterial({color,metalness:1,roughness:.15,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:2.1});
}
function iris() {
  return new THREE.MeshPhysicalMaterial({color:0xddd6f6,metalness:.15,roughness:.055,transmission:.82,thickness:.6,ior:1.4,dispersion:.055,iridescence:1,iridescenceIOR:1.38,iridescenceThicknessRange:[150,550],clearcoat:1,envMapIntensity:2.4});
}
function makePhone(map) {
  const phone=new THREE.Group(),metal=silver();
  phone.add(solid(2.7,5.64,.36,.28,metal,.045));
  const back=solid(2.60,5.53,.33,.06,silver(0xa8a9bb));back.position.z=-.18;phone.add(back);
  const black=solid(2.60,5.53,.32,.05,new THREE.MeshPhysicalMaterial({color:0x050509,roughness:.08,metalness:.6,clearcoat:1}),.013);black.position.z=.16;phone.add(black);
  const display=face(2.48,5.37,.26,new THREE.MeshBasicMaterial({map,toneMapped:false}));display.position.z=.20;phone.add(display);phone.userData.screen=display;
  const glass=face(2.48,5.37,.26,new THREE.MeshPhysicalMaterial({color:0xe7dbff,metalness:.45,roughness:.06,transparent:true,opacity:.018,clearcoat:1,depthWrite:false}));glass.position.z=.211;phone.add(glass);
  const slit=solid(.61,.13,.06,.02,new THREE.MeshStandardMaterial({color:0x060607,roughness:.2}),.005);slit.position.set(0,2.45,.223);phone.add(slit);
  const selfie=new THREE.Mesh(new THREE.CircleGeometry(.032,16),silver(0x486182));selfie.position.set(.18,2.45,.24);phone.add(selfie);
  const cameraBlock=solid(1.05,1.12,.22,.14,silver(0x9494a9));cameraBlock.position.set(-.64,1.85,-.25);phone.add(cameraBlock);
  [[-.82,2.07],[-.48,1.68],[-.91,1.55]].forEach(([x,y])=>{
    const lens=new THREE.Mesh(new THREE.CylinderGeometry(.20,.21,.13,32),silver(0x414149));lens.rotation.x=Math.PI/2;lens.position.set(x,y,-.37);phone.add(lens);
    const inner=new THREE.Mesh(new THREE.CircleGeometry(.155,32),new THREE.MeshPhysicalMaterial({color:0x101528,metalness:.85,roughness:.07,clearcoat:1}));inner.rotation.y=Math.PI;inner.position.set(x,y,-.443);phone.add(inner);
    const glint=new THREE.Mesh(new THREE.CircleGeometry(.037,16),new THREE.MeshBasicMaterial({color:0x6a87b1}));glint.rotation.y=Math.PI;glint.position.set(x-.04,y+.04,-.447);phone.add(glint);
  });
  [[1.4,.6,.06,.78],[-1.4,1,.06,.38],[-1.4,.45,.06,.50]].forEach(([x,y,w,h])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,.13),metal);b.position.set(x,y,0);phone.add(b);});
  const seams=new THREE.Mesh(new THREE.BoxGeometry(2.74,.017,.22),new THREE.MeshStandardMaterial({color:0x252531,roughness:.4}));seams.position.y=-1.9;phone.add(seams);
  return phone;
}
function makeCard(map,w=1.7,h=2.4) {
  const group=new THREE.Group();
  group.add(solid(w,h,.06,.07,silver(0x91909d),.012));
  const picture=face(w-.065,h-.065,.043,new THREE.MeshBasicMaterial({map,toneMapped:false}));picture.position.z=.055;group.add(picture);
  const glass=face(w-.06,h-.06,.043,new THREE.MeshPhysicalMaterial({color:0xfce8ff,transparent:true,opacity:.018,roughness:.1,metalness:.4,clearcoat:1,depthWrite:false}));glass.position.z=.063;group.add(glass);
  const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.005,h+.005,.075)),new THREE.LineBasicMaterial({color:0xffafe8,transparent:true,opacity:.18}));group.add(border);
  group.userData.picture=picture;group.userData.edge=border;picture.userData.card=group;return group;
}
function glowMap() {
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffff');g.addColorStop(.08,'#ffffffcc');g.addColorStop(.3,'#ffffff28');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
function studioEnvironment(renderer) {
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x09080e);
  const shell=new THREE.Mesh(new THREE.BoxGeometry(30,30,30),new THREE.MeshBasicMaterial({color:0x17141e,side:THREE.BackSide}));studio.add(shell);
  const panels=[[-5,3,5,3,10,0xf6f1ff,5],[5,1,2,2,12,0xcad7ff,4],[0,7,1,10,2,0xffffff,6],[-1,-5,-2,8,1,0xce83fb,2],[4,-1,-6,1,9,0xff75c9,3]];
  panels.forEach(([x,y,z,w,h,color,intensity])=>{const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide,toneMapped:false});const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);});
  const generator=new THREE.PMREMGenerator(renderer),target=generator.fromScene(studio,.025);generator.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return target.texture;
}
function metallicRibbon(radius=4.5, tube=.27) {
  const points=[];
  for(let i=0;i<100;i++){const a=i/100*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*(radius+.3*Math.sin(a*3)),Math.sin(a)*(radius*.67+.25*Math.cos(a*2)),Math.sin(a*2)*.7));}
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),mobile.matches?130:230,tube,mobile.matches?10:18,true),silver());
}

// HDR threshold bloom + a depth-aware, subtle background defocus. Mobile uses the direct render path.
class Lens {
  constructor(renderer) {
    this.renderer=renderer;this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));this.scene.add(this.quad);
    this.target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true});this.target.depthTexture=new THREE.DepthTexture(1,1);
    this.smallA=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});this.smallB=this.smallA.clone();
    const vertexShader='varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
    this.blur=new THREE.ShaderMaterial({uniforms:{image:{value:null},direction:{value:new THREE.Vector2()},threshold:{value:0}},vertexShader,fragmentShader:`
      varying vec2 vUv;uniform sampler2D image;uniform vec2 direction;uniform float threshold;
      vec3 sampleLight(vec2 uv){vec3 c=texture2D(image,uv).rgb;float l=max(c.r,max(c.g,c.b));return c*smoothstep(threshold,threshold+.65,l);}
      void main(){vec3 c=sampleLight(vUv)*.227027;c+=sampleLight(vUv+direction*1.384615)*.316216;c+=sampleLight(vUv-direction*1.384615)*.316216;c+=sampleLight(vUv+direction*3.230769)*.070270;c+=sampleLight(vUv-direction*3.230769)*.070270;gl_FragColor=vec4(c,1.);}`});
    this.composite=new THREE.ShaderMaterial({uniforms:{base:{value:this.target.texture},bloom:{value:this.smallA.texture},depth:{value:this.target.depthTexture},pixel:{value:new THREE.Vector2()},focus:{value:13},strength:{value:.15}},vertexShader,fragmentShader:`
      varying vec2 vUv;uniform sampler2D base,bloom,depth;uniform vec2 pixel;uniform float focus,strength;
      void main(){float d=texture2D(depth,vUv).r;float dist=.1*150./(150.-d*(150.-.1));float coc=clamp((dist-focus-10.)/40.,0.,1.)*1.6;vec2 p=pixel*coc;
        vec4 color=texture2D(base,vUv)*.5;color+=texture2D(base,vUv+p)*.125;color+=texture2D(base,vUv-p)*.125;color+=texture2D(base,vUv+vec2(p.x,-p.y))*.125;color+=texture2D(base,vUv+vec2(-p.x,p.y))*.125;
        vec3 light=texture2D(bloom,vUv).rgb;gl_FragColor=vec4(color.rgb+light*strength,max(color.a,min(length(light)*.4,.35)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,transparent:true,depthTest:false,depthWrite:false});
  }
  resize(w,h) {this.target.setSize(w,h);this.smallA.setSize(Math.ceil(w/4),Math.ceil(h/4));this.smallB.setSize(Math.ceil(w/4),Math.ceil(h/4));this.composite.uniforms.pixel.value.set(1/w,1/h);}
  render(scene,camera) {
    const r=this.renderer;r.setRenderTarget(this.target);r.render(scene,camera);
    this.quad.material=this.blur;this.blur.uniforms.image.value=this.target.texture;this.blur.uniforms.direction.value.set(4/this.target.width,0);this.blur.uniforms.threshold.value=1.05;
    r.setRenderTarget(this.smallB);r.render(this.scene,this.camera);
    this.blur.uniforms.image.value=this.smallB.texture;this.blur.uniforms.direction.value.set(0,1/this.smallB.height);this.blur.uniforms.threshold.value=0;
    r.setRenderTarget(this.smallA);r.render(this.scene,this.camera);
    this.quad.material=this.composite;r.setRenderTarget(null);r.render(this.scene,this.camera);
  }
}

export async function createWorld({onProgress,onReady,onShot,onError}) {
  const host=document.querySelector('#world');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){onError(error);return null;}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=!mobile.matches;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x08080c,.009);
  const camera=new THREE.PerspectiveCamera(mobile.matches?44:37,1,.1,150);
  scene.environment=studioEnvironment(renderer);
  const ambient=new THREE.HemisphereLight(0xece7ff,0x121018,1.2);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xfef6ff,5.0);key.position.set(-4,6,9);scene.add(key,key.target);
  const rim=new THREE.PointLight(0xb455ff,80,35,2),rose=new THREE.PointLight(0xff40a4,65,35,2);scene.add(rim,rose);
  const cursor=new THREE.PointLight(0xffe9f8,140,28,2);scene.add(cursor);
  const lightBloom=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap(),color:0xbb5cff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));lightBloom.scale.set(8,8,1);scene.add(lightBloom);
  const state={p:0,target:0,x:0,y:0,tx:0,ty:0,entrance:reduced.matches?1:0,time:0,shotKick:0,finalGather:0,paused:false};
  const groups=Array.from({length:4},(_,i)=>{const g=new THREE.Group();g.position.z=-i*24;scene.add(g);return g;});
  let lens=!mobile.matches?new Lens(renderer):null;
  let frame=0,last=0,hover=-1,shotNumber=0,focusIndex=-1,focusExpires=0,frameCount=0,fpsStart=performance.now();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(4,4),galleryCards=[],shotCards=[],photoMaps=[];
  const pointerPosition=new THREE.Vector3(),look=new THREE.Vector3();
  function resize() {
    const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=mobile.matches?44:37;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile.matches?CONFIG.quality.mobilePixelRatio:CONFIG.quality.desktopPixelRatio));renderer.setSize(w,h);
    if(!mobile.matches&&!lens)lens=new Lens(renderer);
    lens?.resize(renderer.domElement.width,renderer.domElement.height);renderOnce();
  }
  function renderOnce(){if(!ready)return;update(performance.now()/1000,1,true);draw();}
  let ready=false;
  addEventListener('resize',resize,{passive:true});resize();
  const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('人像素材无法加载'));img.src=src;});
  let images;
  try{images=await Promise.all(CONFIG.portraits.map(p=>loadImage(p.src)));}catch(error){onError(error);return null;}
  images.forEach(img=>photoMaps.push(portraitTexture(img)));
  const phoneMaps=images.map(image=>portraitTexture(image,2.48/5.37));const phoneMap=phoneMaps[0];
  const heroPhone=makePhone(phoneMap);groups[0].add(heroPhone);
  const heroSilver=metallicRibbon(4.5,.47);heroSilver.position.set(1.5,.25,-1.8);heroSilver.rotation.set(.4,.38,-.4);groups[0].add(heroSilver);
  const silverLoop=new THREE.Mesh(new THREE.TorusKnotGeometry(1.25,.36,mobile.matches?110:200,16,2,3),silver());silverLoop.position.set(4.4,-1.8,-.6);groups[0].add(silverLoop);
  const glassRing=new THREE.Mesh(new THREE.TorusGeometry(3.7,.10,16,160),iris());glassRing.rotation.set(.65,-.48,.28);glassRing.position.set(1.4,.25,.5);groups[0].add(glassRing);
  const glassArc=new THREE.Mesh(new THREE.TorusGeometry(1.25,.11,14,100),iris());glassArc.position.set(-2.1,2.6,1);glassArc.rotation.set(.6,.3,.6);groups[0].add(glassArc);
  const heroPhotos=[],poses=[[-1.7,1.25,-1.8,1.1,1.5,-.19],[4.3,2.35,-1.5,1.15,1.62,.17],[4.6,-1.5,1.1,1.35,1.92,.15],[-.9,-2.3,.1,1.2,1.67,-.12]];
  poses.forEach((v,i)=>{const c=makeCard(photoMaps[(i+2)%photoMaps.length],v[3],v[4]);c.userData.base=new THREE.Vector3(...v.slice(0,3));c.userData.angle=v[5];groups[0].add(c);heroPhotos.push(c);});
  const galleryCount=mobile.matches?CONFIG.quality.mobileGallery:CONFIG.quality.desktopGallery;
  for(let i=0;i<galleryCount;i++){
    const a=i*.62,depth=-i*.4,radius=3.7+Math.sin(i*.35)*.5;
    const c=makeCard(photoMaps[i%photoMaps.length],i%5===0?1.9:1.4,i%5===0?2.66:1.98);
    c.userData.angle=a;c.userData.radius=radius;c.userData.depth=depth;c.userData.index=i;c.userData.originalZ=depth;c.rotation.z=Math.sin(a)*.10;
    galleryCards.push(c);groups[1].add(c);
  }
  const galleryRing=new THREE.Mesh(new THREE.TorusGeometry(5.1,.035,10,180),iris());galleryRing.rotation.x=.85;galleryRing.position.z=-4;groups[1].add(galleryRing);
  const galleryRibbon=metallicRibbon(4.8,.10);galleryRibbon.rotation.set(.65,.12,-.2);galleryRibbon.position.z=-5;groups[1].add(galleryRibbon);
  const capturePhone=makePhone(phoneMaps[2]);groups[2].add(capturePhone);
  const captureRing=new THREE.Mesh(new THREE.TorusGeometry(3.7,.055,12,140),iris());captureRing.position.set(.8,0,-1.5);captureRing.rotation.set(.5,.7,-.12);groups[2].add(captureRing);
  const captureSculpture=metallicRibbon(4.3,.25);captureSculpture.position.set(.8,-.1,-2.4);captureSculpture.rotation.set(.8,.2,.3);groups[2].add(captureSculpture);
  const finalCards=[];
  const finaleRing=metallicRibbon(5.2,.29);finaleRing.rotation.set(.72,.05,-.2);finaleRing.position.z=-1;groups[3].add(finaleRing);
  const finalGlass=new THREE.Mesh(new THREE.TorusGeometry(4.35,.07,16,150),iris());finalGlass.rotation.set(.7,.1,.3);finalGlass.position.z=.3;groups[3].add(finalGlass);
  for(let i=0;i<(mobile.matches?12:20);i++){
    const a=i/(mobile.matches?12:20)*Math.PI*2,c=makeCard(photoMaps[i%photoMaps.length],i%3===0?1.25:.96,i%3===0?1.75:1.35);
    c.userData.angle=a;c.userData.baseRadius=4.7+(i%3)*.35;finalCards.push(c);groups[3].add(c);
  }
  const specks=new THREE.BufferGeometry(),coords=new Float32Array(54*3);
  for(let i=0;i<54;i++){coords[i*3]=Math.sin(i*12.5)*8;coords[i*3+1]=Math.cos(i*8.4)*5;coords[i*3+2]=-i*1.4;}
  specks.setAttribute('position',new THREE.BufferAttribute(coords,3));scene.add(new THREE.Points(specks,new THREE.PointsMaterial({color:0x9f7fb2,size:.016,transparent:true,opacity:.45,depthWrite:false})));
  function update(time,dt,staticRender=false) {
    const m=mobile.matches,still=reduced.matches,t=still?0:Math.max(0,time-state.time);
    const damping=1-Math.exp(-dt*5);state.x+=(state.tx-state.x)*damping;state.y+=(state.ty-state.y)*damping;
    const dp=1-Math.exp(-dt*7.5);state.p+=(state.target-state.p)*dp;if(Math.abs(state.target-state.p)<.0001)state.p=state.target;
    const p=state.p,part=Math.floor(Math.min(p,2.999)),local=p-part,travel=smooth(.22,1,local),z=lerp(12-part*24,12-(part+1)*24,travel);
    const arc=Math.sin(local*Math.PI)*(m?.4:1.3);
    camera.position.set(state.x*(m?.15:.5)+arc*(part%2?-1:1),state.y*-.24+Math.sin(local*Math.PI)*.55,z+(m?3.7:0));
    look.set(state.x*.18,-state.y*.12,z-14);camera.lookAt(look);camera.rotation.z=Math.sin(local*Math.PI)*(part===0?.055:-.035);
    if(still){const index=Math.round(p);camera.position.set(0,0,12-index*24+(m?3.7:0));camera.lookAt(0,0,-index*24);}
    groups.forEach((g,i)=>{g.visible=Math.abs(p-i)<.92;});
    const enter=still?1:state.entrance,heroTravel=smooth(.05,.8,p);
    heroPhone.position.set((m?0:1.55)+heroTravel*3.1,(m?-1.65:.10)+Math.sin(t*.72)*.06-(1-enter)*1.4,heroTravel*3);
    heroPhone.rotation.set(-.10+state.y*.04,-.34+state.x*.10+(1-enter)*1.6+heroTravel*1.5,-.17+Math.sin(t*.23)*.035+heroTravel*.5);
    heroPhone.userData.screen.material.transparent=true;heroPhone.userData.screen.material.opacity=smooth(.08,.65,enter);heroPhone.scale.setScalar(m?.82:1.08);heroSilver.rotation.z=-.4+t*.018;heroSilver.scale.setScalar(m?.74:1);heroSilver.position.y=m?-1.35:.25;
    silverLoop.rotation.set(t*.12,.3+t*.08,.1);silverLoop.scale.setScalar(m?.65:1);silverLoop.position.set(m?2.4:4.4,m?-3.0:-1.8,-.6);
    glassRing.rotation.z=.28+t*.025;glassRing.rotation.y=-.48+Math.sin(t*.25)*.1;glassRing.scale.setScalar(m?.78:1);glassRing.position.y=m?-1.4:.25;glassRing.position.z=.5+(1-enter)*7;
    glassArc.rotation.y=.3+t*.04;glassArc.position.set(m?-2.0:-2.1,m?-.9:2.6,1);glassArc.scale.setScalar(m?.65:1);
    heroPhotos.forEach((c,i)=>{const b=c.userData.base,spread=1+heroTravel*1.8,delay=clamp((enter-i*.10)/(1-i*.10),0,1);c.position.set((m?b.x*.65:b.x)*spread,(m?b.y*.68-1.5:b.y)+Math.sin(t*(.45+i*.1)+i)*.09,b.z-(1-delay)*5);c.rotation.set(.02,-.12+state.x*.08,c.userData.angle+Math.sin(t*.3+i)*.025);c.scale.setScalar((m?.72:1)*Math.max(.01,delay));});
    const galleryPhase=t*.025+smooth(.45,1.65,p)*.25;
    galleryCards.forEach((c,i)=>{
      const a=c.userData.angle+galleryPhase,r=c.userData.radius,front=i===hover||i===focusIndex;
      const neighbor=hover>=0&&Math.min(Math.abs(i-hover),galleryCards.length-Math.abs(i-hover))<=2&&!front;
      const destination=new THREE.Vector3(Math.cos(a)*r*(m?.88:1),Math.sin(a)*r*.70,c.userData.depth+Math.sin(a)*.5);
      if(front){destination.multiplyScalar(.48);destination.z=5.2;}else if(neighbor){destination.x*=1.15;destination.y*=1.15;destination.z-=.5;}
      c.position.lerp(destination,staticRender?1:1-Math.exp(-dt*(front?6:3)));
      c.rotation.x=lerp(c.rotation.x,front?-.08:Math.sin(a)*.08,damping);c.rotation.y=lerp(c.rotation.y,front?state.x*.08:-Math.cos(a)*.13,damping);c.rotation.z=lerp(c.rotation.z,front?-.045:Math.sin(a)*.12,damping);
      const scale=front?1.18:1;c.scale.lerp(new THREE.Vector3(scale,scale,scale),damping);c.userData.edge.material.opacity=front?.5+.25*Math.sin(t*4):.13;
    });
    if(focusIndex>=0&&performance.now()>focusExpires){focusIndex=-1;document.dispatchEvent(new CustomEvent('galleryfocus',{detail:-1}));}
    galleryRing.rotation.z=t*.022;galleryRibbon.rotation.y=.12+Math.sin(t*.14)*.15;
    capturePhone.position.set(m?0:.9,m?-.9:.4-state.shotKick*.20,-state.shotKick*.45);
    capturePhone.rotation.set(.04+state.y*.05,-.14+state.x*.12+Math.sin(t*.3)*.025,.055-state.shotKick*.04);capturePhone.scale.setScalar(m?.8:1);
    captureRing.rotation.z=-.12+t*.03;captureRing.scale.setScalar(m?.82:1);captureRing.position.y=m?-.8:0;
    captureSculpture.rotation.z=.3-t*.016;captureSculpture.scale.setScalar(m?.78:1);captureSculpture.position.y=m?-.8:-.1;
    const gather=smooth(2.15,2.9,p),radius=lerp(7.5,4.7,gather);
    finalCards.forEach((c,i)=>{const a=c.userData.angle+t*.035,r=radius+(i%3)*.28;c.position.set(Math.cos(a)*r*(m?.7:1),Math.sin(a)*r*.60,Math.sin(a)*1.9-(1-gather)*4);c.rotation.set(Math.sin(a)*.1,-Math.cos(a)*.14,Math.sin(a)*.12);c.scale.setScalar(m?.72:1);});
    finaleRing.rotation.y=.05+Math.sin(t*.2)*.14;finaleRing.rotation.z=-.2+t*.016;finaleRing.scale.setScalar(m?.77:1);finalGlass.rotation.z=.3-t*.02;finalGlass.scale.setScalar(m?.8:1);
    shotCards.forEach((c,i)=>{if(!c.userData.flying&&!still)c.position.y=c.userData.restY+Math.sin(t*.7+i)*.075;});
    key.position.set(-3+state.x*2,5-state.y*2,camera.position.z+2);key.target.position.set(0,0,camera.position.z-13);
    cursor.position.set(state.x*6,2-state.y*5,camera.position.z-5);cursor.intensity=still?90:140;rim.position.set(5,2,camera.position.z-11);rose.position.set(-4,-1,camera.position.z-10);
    rose.color.setHex(p>1.8?0xff3b9e:0xff53b9);rim.color.setHex(p>2.5?0x777aff:0xa33fff);lightBloom.position.set(4,-1,camera.position.z-16);lightBloom.material.opacity=enter*.17;
    const reveal=still?1:smooth(0,.7,enter);scene.environmentIntensity=lerp(.035,1,reveal);key.intensity=3.4*reveal;ambient.intensity=.75*reveal;
    lens&&(lens.composite.uniforms.focus.value=m?16:13);
    host.dataset.progress=p.toFixed(3);host.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');host.dataset.photos=String(shotCards.length);host.dataset.gallery=String(galleryCards.length);host.dataset.reduced=String(still);onProgress(p,state.x,state.y);
  }
  function draw(){if(lens&&!mobile.matches)lens.render(scene,camera);else{renderer.setRenderTarget(null);renderer.render(scene,camera);}}
  function tick(now){frame=0;if(document.hidden||state.paused||!ready)return;const dt=Math.min((now-last)/1000,.05)||.016;last=now;update(now/1000,dt);draw();frameCount++;if(now-fpsStart>1000){host.dataset.fps=String(Math.round(frameCount*1000/(now-fpsStart)));fpsStart=now;frameCount=0;}if(!reduced.matches||Math.abs(state.p-state.target)>.001)frame=requestAnimationFrame(tick);}
  function wake(){if(!frame&&!document.hidden&&!state.paused&&ready){last=performance.now();frame=requestAnimationFrame(tick);}}
  function setProgress(p){state.target=clamp(p,0,3);if(reduced.matches){state.p=state.target;renderOnce();}else wake();}
  function focus(index){focusIndex=index<0?-1:index%galleryCards.length;focusExpires=performance.now()+3500;document.dispatchEvent(new CustomEvent('galleryfocus',{detail:focusIndex}));if(reduced.matches)renderOnce();else wake();}
  function pick(e){if(state.p<.68||state.p>1.4)return -1;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(galleryCards.map(c=>c.userData.picture),false)[0];return hit?hit.object.userData.card.userData.index:-1;}
  host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;state.tx=e.clientX/innerWidth*2-1;state.ty=e.clientY/innerHeight*2-1;hover=pick(e);host.style.cursor=hover>=0?'pointer':'default';if(reduced.matches)renderOnce();else wake();},{passive:true});
  host.addEventListener('pointerleave',()=>{state.tx=0;state.ty=0;hover=-1;host.style.cursor='default';if(reduced.matches)renderOnce();});
  host.addEventListener('click',e=>{const index=pick(e);if(index>=0)focus(index);});
  function capture(){
    if(!ready||state.p<1.65||state.p>2.45)return false;
    const n=shotNumber++,card=makeCard(photoMaps[(n+1)%photoMaps.length],1.35,1.91);groups[2].add(card);shotCards.push(card);card.position.copy(capturePhone.position);card.position.z=.5;
    const positions=mappedShotPositions(mobile.matches),place=positions[n%positions.length];
    if(shotCards.length>6){const removed=shotCards.shift();gsap.killTweensOf(removed.position);gsap.killTweensOf(removed.rotation);gsap.killTweensOf(removed.scale);groups[2].remove(removed);removed.userData.timeline?.kill();removed.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
    card.userData.flying=true;card.userData.restY=place[1];capturePhone.userData.screen.material.map=phoneMaps[(n+2)%images.length];
    if(reduced.matches){card.position.set(...place.slice(0,3));card.rotation.set(0,-.08,place[3]);card.userData.flying=false;renderOnce();}
    else{
      card.rotation.set(0,0,-.06);card.scale.setScalar(.68);
      card.userData.timeline=gsap.timeline({onComplete:()=>{card.userData.flying=false;}}).to(card.position,{z:5.5,y:card.position.y+.8,x:card.position.x-.4,duration:.44,ease:'power2.out'},0).to(card.rotation,{y:Math.PI*1.55,z:-.45,duration:.55,ease:'power2.out'},0).to(card.scale,{x:1.1,y:1.1,z:1.1,duration:.5,ease:'power2.out'},0).to(card.position,{x:place[0],y:place[1],z:place[2],duration:1.1,ease:'power3.out'},.40).to(card.rotation,{x:.025,y:Math.PI*2-.08,z:place[3],duration:1.0,ease:'power3.out'},.42).to(card.scale,{x:1,y:1,z:1,duration:.7,ease:'power3.out'},.75);
      gsap.fromTo(state,{shotKick:1},{shotKick:0,duration:.8,ease:'elastic.out(1,.35)'});wake();
    }
    onShot(shotNumber,shotCards.length);return true;
  }
  function replay(){state.time=performance.now()/1000;capturePhone.userData.screen.material.map=phoneMaps[2];state.shotKick=0;state.p=0;state.target=0;shotCards.forEach(c=>{gsap.killTweensOf(c.position);gsap.killTweensOf(c.rotation);gsap.killTweensOf(c.scale);groups[2].remove(c);c.userData.timeline?.kill();c.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});});shotCards.length=0;shotNumber=0;focusIndex=-1;hover=-1;state.entrance=reduced.matches?1:0;state.tx=state.ty=0;if(!reduced.matches)gsap.to(state,{entrance:1,duration:2.8,delay:.2,ease:'power2.out'});onShot(0,0);wake();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  reduced.addEventListener('change',()=>{state.entrance=1;if(reduced.matches){cancelAnimationFrame(frame);frame=0;state.p=state.target;state.shotKick=0;shotCards.forEach(c=>c.userData.timeline?.progress(1));renderOnce();}else wake();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();state.paused=true;cancelAnimationFrame(frame);document.body.classList.remove('webgl-ready');onError(new Error('图形场景暂时不可用'));});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  state.time=performance.now()/1000;ready=true;resize();state.p=state.target;document.body.classList.add('webgl-ready');
  if(!reduced.matches)gsap.to(state,{entrance:1,duration:2.8,delay:.15,ease:'power2.out'});onReady();wake();
  return {setProgress,capture,replay,focus,stats:()=>({progress:+state.p.toFixed(3),galleryCards:galleryCards.length,shotNumber,floatingPhotos:shotCards.length,webgl:true,bloom:!mobile.matches,camera:camera.position.toArray().map(n=>+n.toFixed(2)),reducedMotion:reduced.matches,renderCalls:renderer.info.render.calls})};
}
function mappedShotPositions(mobile) {
  return mobile?[[-1.45,.6,1.1,-.14],[1.45,-1.3,1.5,.16],[-1.1,-2.5,1.6,-.12],[1.45,1,.8,.13],[-1.4,1.4,.7,-.13],[1.2,-2.7,.8,.12]]:[[-1.7,1.8,2,-.14],[3.35,-1.3,2.7,.16],[-1.9,-1.5,3,-.12],[3.55,2,1.6,.10],[-.4,3,1.4,-.12],[2.8,-2.8,1.2,.13]];
}
