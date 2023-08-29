import './lib/components'
import { skyBlue, kellyGreen } from './lib/constants/colors'
import { shadows } from './lib/shadows'
import { trees } from './lib/trees'
import { armies } from './lib/armies'
import { paths } from './lib/paths'
import { parchment } from './lib/parchment'
import { state } from './lib/stores'
import { eventObject } from './lib/util/helpers'
import { getObjectByName } from './lib/util/three'
import { attrib, create, query } from './lib/util/dom'

let renderer: THREE.WebGLRenderer

let lights = (scene: THREE.Scene) => {
  let dir = new THREE.DirectionalLight('#fff', 2)
  scene.add(dir)
  dir.position.set(1, 2, 1)
  dir.target
  
  let { shadow } = dir 
  shadow.bias = 0.000_01
  shadow.mapSize.set(2048, 2048)
  shadow.normalBias = 0.02

  let { camera } = shadow
  camera.left = camera.bottom = -5
  camera.right = camera.top = 5
}

let aScene = create('a-scene', {
  frame: '',
  reflection: '',
  fog: `far:5;color:${skyBlue}`,
  shadow: 'type:pcfsoft',
  // 'vr-mode-ui': 'enabled: false',
  renderer: 'antialias:true;colorManagement:true;highRefreshRate:true;physicallyCorrectLights:true;toneMapping:ACESFilmic',
}, {
  loaded(event) {
    renderer = (event.target as unknown as { renderer: THREE.WebGLRenderer }).renderer
    renderer.xr.setFoveation(1)
    trees(scene)
    armies(scene)
    parchment(scene)
    paths(scene)
    lights(scene)
  },
  'enter-vr': () => {
    renderer.xr.getSession()?.updateTargetFrameRate(120)?.catch(() => { /* do nothing */ })
    attrib(handLeftEl, 'visible', true)
    attrib(handRightEl, 'visible', true)
    state.set('intro')
  }
})

let scene = aScene.object3D as THREE.Scene

let raycaster = 'objects:.collidable;lineOpacity:1;autoRefresh:false'

let handRightEl = create('a-entity', {
  id: 'hand_left',
  visible: false,
  'laser-controls': `hand:left;model:false`,
  raycaster,
}, {
  triggerdown() { console.log('triggerdown') },
  triggerup() { console.log('triggerup') }
})

let handLeftEl = create('a-entity', {
  id: 'hand_right',
  visible: false,
  'laser-controls': `hand:right;model:false`,
  raycaster,
}, {
  triggerdown() { console.log('triggerdown') },
  triggerup() { console.log('triggerup') }
})
aScene.append(handLeftEl, handRightEl)

aScene.append(create('a-sky', {
  color: skyBlue
}))

aScene.append(create('a-light', {
  type: 'ambient',
  color: '#445451'
}))

aScene.append(create('a-camera', {
  position: '0 0.5 1.8',
  'look-controls-enabled': false,
}))

aScene.append(create('a-cylinder', {
  radius: 30,
  height: 0.01,
  color: kellyGreen,
  class: 'collidable',
  raycasted: '',
}, {
  intersection(event) {
    console.log(event)
  }
}))

aScene.append(create('a-gltf-model', {
  src: 'castle-prod.glb',
}, {
  'model-loaded': (event) => {
    let scepter = getObjectByName(eventObject(event), 'scepter')!
    let orb = getObjectByName(eventObject(event), 'orb')!

    query('#hand_right').object3D.add(scepter)
    query('#hand_left').object3D.add(orb)

    shadows(scene)
  }
}))

let h1 = create('h1', {
  class: 'z-10 fixed text-white text-9xl text-center w-full'
})
h1.innerHTML = '<q>Keep Calm</q>'

// let btn = create('button', {
//   class: 'z-10 fixed bottom-8 text-5xl w-full text-white bg-transparent border-none'
// }, {
//   async click() {
//     const session = await navigator.xr!.requestSession('immersive-vr', {
//       optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
//     })
//     await renderer.xr.setSession(session)
//     console.log('click')
//   }
// })
// btn.innerHTML = hasNativeWebVRImplementation ? 'Start' : 'VR Unsupported'


document.body.append(h1, aScene)
