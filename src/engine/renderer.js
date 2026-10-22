import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// N64-Look: Szene in ein kleines Render-Target (ca. 320x240) zeichnen, danach mit
// Farbquantisierung (16 Bit) und Bayer-Dithering hochskalieren.
const VERTEX = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAGMENT = `
  uniform sampler2D tBild; uniform vec2 aufloesung; uniform float blitz; uniform float dunkel;
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
    float d = (bayer(vUv * aufloesung) - 0.5) / 31.0;
    c = floor((c + d) * 31.0 + 0.5) / 31.0;
    c = mix(c, vec3(1.0), blitz);
    c *= 1.0 - dunkel;
    gl_FragColor = vec4(c, 1.0);
  }`;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(1);
    this.gl.shadowMap.enabled = false;
    this.breite = 320;
    this.ziel = new THREE.WebGLRenderTarget(320, 240, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    this.material = new THREE.ShaderMaterial({
      uniforms: { tBild: { value: this.ziel.texture }, aufloesung: { value: new THREE.Vector2(320, 240) },
        blitz: { value: 0 }, dunkel: { value: 0 } },
      vertexShader: VERTEX, fragmentShader: FRAGMENT, depthTest: false, depthWrite: false,
    });
    this.quadSzene = new THREE.Scene();
    this.quadSzene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.quadKamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.kamera = new THREE.PerspectiveCamera(60, 4 / 3, 0.1, 400);
    this.wackeln = 0;
    window.addEventListener('resize', () => this.groesse());
    this.groesse();
  }
  groesse() {
    const w = window.innerWidth, h = window.innerHeight;
    this.gl.setSize(w, h, false);
    const zb = this.breite, zh = Math.max(120, Math.round(zb * h / w));
    this.ziel.setSize(zb, zh);
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
    this.gl.setRenderTarget(this.ziel); this.gl.render(szene, this.kamera);
    this.gl.setRenderTarget(null); this.gl.render(this.quadSzene, this.quadKamera);
  }
  blitz(staerke = .6) { this.material.uniforms.blitz.value = staerke; }
  setzeDunkel(v) { this.material.uniforms.dunkel.value = v; }
}
