<script lang='ts'>

import './lib/systems'
import { tick } from 'svelte'
import { shadows } from './lib/shadows'
import Lights from './lib/components/lights.svelte'
import Environment from './lib/components/environment.svelte'
import Person from './lib/components/person.svelte';

const handleLoad = async (event: any) => {
  await tick()
  shadows(event.target.object3D)
}

const handleCameraLoad = (event: any) => {
  const [camera] = event.target.object3D.children
  camera.lookAt(0, 0, 0)
}

</script>

<a-scene
  vr-mode-ui='enterVRButton:#vr-btn'
  renderer='antialias:true;colorManagement:true;highRefreshRate:true;physicallyCorrectLights:true;toneMapping:ACESFilmic'
  on:loaded={handleLoad}
>
  <Lights />
  <Environment />
  <Person position='0 1.05 0' color='red' />

  <a-entity position="0 3 0">
    <a-camera
      look-controls-enabled='false'
      look-at='0 0 0'
      on:loaded={handleCameraLoad}
    />
  </a-entity>
</a-scene>

<a
  id='vr-btn'
  class='bg-black z-10 bg-opacity-50 border border-white text-white px-8 py-3 cursor-pointer text-lg'
>
  Start
</a>
