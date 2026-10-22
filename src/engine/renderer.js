import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// Rendert die Szene in ein Render-Target und zeichnet es mit Nachbearbeitung auf den Bildschirm.
// Drei Stufen: 'weich' (halbe Auflösung, MSAA, leichtes Dithering, sanfte Vignette),
// 'hoch' (volle Auflösung, MSAA, ohne Quantisierung) und 'retro' (320 Pixel breit, 16 Bit, Bayer).
const VERTEX = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAGMENT = `
  uniform sampler2D tBild; uniform vec2 aufloesung; uniform float blitz; uniform float dunkel;
  uniform float stufen; uniform float dither; uniform float vignette; uniform float saettigung; uniform float wasser;
  varying vec2 vUv;
  float bayer(vec2 p){
    int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
    int i = x + y * 4;
    float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;
    m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
    for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0;
    return 0.0;
  }
  void main(){
    vec3 c = texture2D(tBild, vUv).rgb;
    c = pow(max(c, 0.0), vec3(1.0 / 2.2));
    float grau = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(grau), c, saettigung);
    if (stufen > 0.0) {
      float d = (bayer(vUv * aufloesung) - 0.5) / stufen * dither;
      c = floor((c + d) * stufen + 0.5) / stufen;
    }
    vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q) * vignette;
    c *= clamp(v, 0.0, 1.0);
    c = mix(c, c * vec3(0.55, 0.85, 1.15) + vec3(0.0, 0.03, 0.08), wasser);
    c = mix(c, vec3(1.0), blitz);
    c *= 1.0 - dunkel;
    gl_FragColor = vec4(c, 1.0);
  }`;

const STUFEN = {
  retro: { breite: 320, samples: 0, stufen: 31, dither: 1, vignette: .35, filter: THREE.NearestFilter, saettigung: 1.0 },
  weich: { skala: .5, min: 640, samples: 4, stufen: 63, dither: .6, vignette: .5, filter: THREE.LinearFilter, saettigung: 1.08 },
  hoch: { skala: 1, min: 960, samples: 4, stufen: 0, dither: 0, vignette: .45, filter: THREE.LinearFilter, saettigung: 1.08 },
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(1);
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.material = new THREE.ShaderMaterial({
      uniforms: { tBild: { value: null }, aufloesung: { value: new THREE.Vector2(320, 240) }, blitz: { value: 0 }, dunkel: { value: 0 },
        stufen: { value: 0 }, dither: { value: 0 }, vignette: { value: .4 }, saettigung: { value: 1 }, wasser: { value: 0 } },
      vertexShader: VERTEX, fragmentShader: FRAGMENT, depthTest: false, depthWrite: false,
    });
    this.quadSzene = new THREE.Scene();
    this.quadSzene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.quadKamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.kamera = new THREE.PerspectiveCamera(58, 4 / 3, 0.1, 500);
    this.wackeln = 0; this.ziel = null;
    let stufe = 'weich'; this.schatten = true;
    try { stufe = localStorage.getItem('ringel64.grafik') || 'weich'; this.schatten = localStorage.getItem('ringel64.schatten') !== '0'; } catch (e) { /* egal */ }
    this.gl.shadowMap.enabled = this.schatten;
    this.setzeStufe(STUFEN[stufe] ? stufe : 'weich');
    window.addEventListener('resize', () => this.groesse());
  }
  setzeSchatten(an) { this.schatten = an; this.gl.shadowMap.enabled = an; try { localStorage.setItem('ringel64.schatten', an ? '1' : '0'); } catch (e) { /* egal */ } }
  setzeStufe(name) {
    this.stufe = name; const s = STUFEN[name];
    this.material.uniforms.stufen.value = s.stufen; this.material.uniforms.dither.value = s.dither;
    this.material.uniforms.vignette.value = s.vignette; this.material.uniforms.saettigung.value = s.saettigung;
    try { localStorage.setItem('ringel64.grafik', name); } catch (e) { /* egal */ }
    this.groesse();
  }
  groesse() {
    const w = window.innerWidth, h = window.innerHeight;
    this.gl.setSize(w, h, false);
    const s = STUFEN[this.stufe];
    let zb = s.breite || Math.max(s.min, Math.round(w * s.skala)); zb = Math.min(zb, w);
    const zh = Math.max(120, Math.round(zb * h / w));
    if (this.ziel) this.ziel.dispose();
    this.ziel = new THREE.WebGLRenderTarget(zb, zh, { minFilter: s.filter, magFilter: s.filter, depthBuffer: true, samples: s.samples });
    this.material.uniforms.tBild.value = this.ziel.texture;
    this.material.uniforms.aufloesung.value.set(zb, zh);
    this.kamera.aspect = zb / zh; this.kamera.updateProjectionMatrix();
  }
  zeichne(szene, dt) {
    if (this.wackeln > 0) {
      this.wackeln = Math.max(0, this.wackeln - dt * 2.5);
      const s = this.wackeln * 0.25;
      this.kamera.position.x += (Math.random() - .5) * s; this.kamera.position.y += (Math.random() - .5) * s;
    }
    this.material.uniforms.blitz.value *= Math.pow(0.02, dt);
    const w = this.material.uniforms.wasser; w.value += ((this.unterwasser ? 1 : 0) - w.value) * Math.min(1, dt * 6);
    this.gl.setRenderTarget(this.ziel); this.gl.render(szene, this.kamera);
    this.gl.setRenderTarget(null); this.gl.render(this.quadSzene, this.quadKamera);
  }
  blitz(staerke = .6) { this.material.uniforms.blitz.value = staerke; }
  setzeUnterwasser(an) { this.unterwasser = an; }
  setzeDunkel(v) { this.material.uniforms.dunkel.value = v; }
}
export const GRAFIK_STUFEN = Object.keys(STUFEN);
