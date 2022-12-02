import * as THREE from 'three'
import Experience from '../Experience.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import * as dat from 'lil-gui'
import System, {
  Emitter,
  Rate,
  Span,
  Position,
  Mass,
  Radius,
  Life,
  PointZone,
  LineZone,
  Vector3D,
  Alpha,
  Scale,
  Color,
  Body,
  RadialVelocity,
  MeshRenderer,
  SpriteRenderer,
  BodySprite,
  Debug,
  Gravity
} from "three-nebula";


// import fragmentShader from '/static/shaders/fragment.glsl'
// import vertexShader from '/static/shaders/fragment.glsl'

export default class SkyWater {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.renderer = this.experience.renderer.instance
    this.camera = this.experience.camera.instance
    this.sun = new THREE.Vector3();
    this.water = null
    this.sky = null
    this.gui = new dat.GUI()
    this.sphere = null
    this.parameters = {
      elevation: 2,
      azimuth: 180
    }
    this.ctha = 0;
    this.r = 500;
    this.tha = 0;

    this.setWater()
    this.setParticles()
    // this.setPlane()
    // this.setSky()
    // this.updateSun()
    const app = document.querySelector('#app')
    const clickBtn = document.querySelector(".click");


    const animationLoad = lottie.loadAnimation({
      container: app, // the dom loading that will contain the animation
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: "https://assets6.lottiefiles.com/packages/lf20_OQFbEEEmHE.json", // the path to the animation json
      preserveAspectRatio: 'xMidYMid meet',
    });

    animationLoad.play();

    clickBtn.addEventListener("click", () => {
      this.setSphere()

      this.setAudio()
      setTimeout(() => {
        clickBtn.style.display = "none";
        app.style.display = "none";
      }, 500);
    });
  }

  setWater() {
    const texture = new THREE.TextureLoader().load("../textures/stars.jpg");
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(4, 4);
    this.scene.background = texture;
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
    this.water = new Water(
      waterGeometry,
      {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('textures/Water_1_M_Normal.jpg', function (texture) {

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x000000,
        distortionScale: 1.5,
        // fog: this.scene.fog
      }

    );
    this.water.rotation.x = - Math.PI / 2;
    this.scene.add(this.water);
    console.log(this.water.material.roughness);

  }
  setSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(1000);
    this.scene.add(this.sky);

    const skyUniforms = this.sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const folderSky = this.gui.addFolder('Sky');
    folderSky.add(this.parameters, 'elevation', 0, 90, 0.001).onChange(this.updateSun);
    folderSky.add(this.parameters, 'azimuth', - 180, 180, 0.001).onChange(this.updateSun);
    folderSky.open();


  }
  setSphere() {
    const vertexShader = `
    uniform float uTime;
uniform float uNoiseStrength;
varying vec3 vNormal;
uniform float uSpeed;
uniform float uNoiseDensity;

// attribute type is used for the data that change among the vertices
attribute float aRandom;

  // GLSL textureless classic 3D noise "cnoise",
  // with an RSL-style periodic variant "pnoise".
  // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
  // Version: 2011-10-11
  //
  // Many thanks to Ian McEwan of Ashima Arts for the
  // ideas for permutation and gradient selection.
  //
  // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
  // Distributed under the MIT license. See LICENSE file.
  // https://github.com/ashima/webgl-noise
  //

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

  // Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep) {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

void main() {
    float t = uTime * uSpeed;
    float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * uNoiseStrength;

    vec3 pos = position + (normal * distortion) ;

    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}

    `
    const fragmentShader = `
    varying vec3 vNormal;




    void main() {


      gl_FragColor = vec4(vNormal, 1.0);
    }

    `

    let settings = {
      speed: 0.2,
      density: 2.5,
    };
    const geometry = new THREE.SphereBufferGeometry(1, 200, 200)
    // console.log(geometry)

    const count = geometry.attributes.position.count //number of vertices in the geometry
    const randoms = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      randoms[i] = Math.random()
    }
    // console.log(randoms)

    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))


    const SphereMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uNoiseStrength: { value: 0 },

        uSpeed: { value: settings.speed },
        uNoiseDensity: { value: settings.density },
      },
      wireframe: true,

    });


    this.sphere = new THREE.Mesh(geometry, SphereMaterial);
    this.sphere.position.set(0, 5, 180);
    this.sphere.scale.set(3.5, 3.5, 3.5);
    this.sphere.castShadow = true;
    this.scene.add(this.sphere);
    setInterval(() => {
      this.sphere.material.wireframe = Math.random() > 0.5 ? true : false;

    }, 5000);

  }

  setAudio() {
    const listener = new THREE.AudioListener();
    this.camera.add(listener);
    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('../sounds/10ans.mp3', function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
      sound.play();


    });
    this.analyser = new THREE.AudioAnalyser(sound, 128);

    this.data = this.analyser



  }
  setPlane() {
    const geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.position.set(0, 0, 0);
    this.plane.rotation.x =2* Math.PI /2 ;
    this.plane.receiveShadow = true;
    this.scene.add(this.plane);



  }


  updateSun() {

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const theta = Math.PI * (this.parameters.elevation - 0.5);
    const phi = 2 * Math.PI * (this.parameters.azimuth - 0.5);

    this.sun.x = Math.cos(phi);
    this.sun.y = Math.sin(phi) * Math.sin(theta);
    this.sun.z = Math.sin(phi) * Math.cos(theta);

    this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
    this.water.material.uniforms['sunDirection'].value.copy(this.sun).normalize();

    this.scene.environment = pmremGenerator.fromScene(this.sky).texture;




  }
  setParticles() {
    this.system = new System();
    this.emitter = new Emitter();
    this.emitter2 = new Emitter();
    this.renderer = new SpriteRenderer(this.scene, THREE);

    function createSprite1() {
      const map = new THREE.TextureLoader().load("../textures/butterfly.png");
      const material = new THREE.SpriteMaterial({
        map: map,
        color: 0xfffff,
        blending: THREE.AdditiveBlending,
        fog: true
      });
      return new THREE.Sprite(material);
    }
    function createSprite2() {
      const map = new THREE.TextureLoader().load("../textures/butterFly2.png");
      const material = new THREE.SpriteMaterial({
        map: map,
        color: 0xfffff,
        blending: THREE.AdditiveBlending,
        fog: true
      });
      return new THREE.Sprite(material);
    }
    // three random color
    const color = new THREE.Color("red");

    const color2 = new THREE.Color("yellow");

    // Set emitter rate (particles per second) as well as the particle initializers and behaviours
    this.emitter
      .setRate(new Rate(new Span(2, 8), new Span(0.01)))
      .setInitializers([
        new Position(new PointZone(0, 0)),
        new Mass(1),
        new Radius(3, 6),
        new Life(2),
        new Body(createSprite1()),
        new RadialVelocity(40, new Vector3D(0, 1, 0), 180),
      ])
      .setBehaviours([
        new Alpha(1, 0),
        new Scale(1, 2),
        new Color(color),
      ])
      .emit();
    this.emitter2
      .setRate(new Rate(new Span(2, 8), new Span(0.01)))
      .setInitializers([
        new Position(new PointZone(0, 0)),
        new Mass(1),
        new Radius(3, 6),
        new Life(2),
        new Body(createSprite2()),
        new RadialVelocity(60, new Vector3D(0, 1, 0), 180),
      ])
      .setBehaviours([
        new Alpha(1, 0),
        new Scale(1, 2),
        new Color(color2),
      ])
      .emit();

    // add the emitter and a renderer to your particle system
    this.system
      .addEmitter(this.emitter)
      .addEmitter(this.emitter2)
      .addRenderer(this.renderer)

  }

  update() {
    const clock = new THREE.Clock()
    const elapsedTime = clock.getElapsedTime()
    const delta = clock.getDelta()
    this.water.material.uniforms['time'].value += 1.0 / 60.0;
    let data
    if (this.analyser && this.sphere) {
      data = this.analyser.getAverageFrequency()
      this.sphere.material.uniforms.uNoiseStrength.value = data / 256;
      this.sphere.material.uniforms.uTime.value = elapsedTime;

    }

    delta < 5 / 60 && this.system.update();
    this.tha += Math.PI / 150;
    let p = 100 * Math.sin(2 * this.tha);
    this.emitter.position.x = 100 + p * Math.cos(this.tha);
    this.emitter.position.y = p * Math.sin(this.tha);
    this.emitter.position.z = (p * Math.tan(this.tha)) / 2;
    // reverse emitter direction for emitter2
    this.emitter2.position.x = -100 + -p * Math.cos(this.tha);
    this.emitter2.position.y = -p * Math.sin(this.tha);
    this.emitter2.position.z = -(p * Math.tan(this.tha)) / 2;
    this.ctha += 0.016;
    // this.r = 300
    // set de emitter rate depending on the data
    this.emitter.setRate(new Rate(new Span(0, data / 11), new Span(0.01)))
    this.emitter2.setRate(new Rate(new Span(0, data / 15), new Span(0.01)))

  }
}
