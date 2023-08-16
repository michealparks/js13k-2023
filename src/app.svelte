<script lang='ts'>

import './lib/systems'
import { skyBlue, kellyGreen } from './lib/constants/colors'
import { shadows, setShadowMapSize } from './lib/shadows'
import { eventObject } from './lib/helpers'
import Person from './lib/components/person.svelte'

let addShadows = async (event: any) =>
  setTimeout(() => shadows(eventObject(event)), 100)

let handleLightLoad = (event: any) =>
  setShadowMapSize(eventObject(event).children[0] as THREE.Light)

let handleCameraLoad = (event: any) => {
  let camera = eventObject(event).children[0] as THREE.Camera
  camera.position.set(0, 0.01, 0)
  camera.position.set(0.8, 0.0, 0.8)
  camera.lookAt(0, 0, 0)
}

const leftHand = 'hand:left'
const rightHand = 'hand:right'

</script>

<a-scene
  gltf-model='meshoptDecoderPath:https://unpkg.com/meshoptimizer@0.19.0/meshopt_decoder.js;'
  shadow='type:pcfsoft;'
  renderer='antialias:true;colorManagement:true;highRefreshRate:true;physicallyCorrectLights:true;toneMapping:ACESFilmic;'
  on:loaded={addShadows}
>
  <a-light type='ambient' intensity='10' color='#445451' />
  <a-light
    type='directional'
    intensity='2'
    position='2 4 4'
    on:loaded={handleLightLoad}
  />

  
  <a-sky color={skyBlue} />

  <a-cylinder radius={1} height={0.01} position='0 0.3 0' color={kellyGreen}>
    <a-gltf-model src="env.glb" on:loaded={addShadows} />

    <a-text position='0 0.5 0' value='Hello, World!' />

  </a-cylinder>

  <a-entity hand-controls={leftHand} hand-tracking-controls={leftHand} laser-controls={leftHand} />
  <a-entity hand-controls={rightHand} hand-tracking-controls={rightHand} laser-controls={rightHand} />

  <Person position='1.2 0.1 1.2' color='red' />

  <a-camera
    look-controls-enabled='true'
    on:loaded={handleCameraLoad}
  />

  <a-box id='person' depth={0.5} width={0.5} height={1.8} position='0 0 -2' />
</a-scene>
