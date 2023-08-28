<script lang='ts'>

import './lib/components'
import { skyBlue, kellyGreen } from './lib/constants/colors'
import { shadows } from './lib/shadows'
import { trees } from './lib/trees'
import { armies } from './lib/armies'
import { paths } from './lib/paths'
import { eventObject } from './lib/components/helpers'
import Parchment from './lib/parchment.svelte'
import { useThree } from './lib/hooks'
import { state } from './lib/stores'
  import { WebGLRenderer } from 'three';

let ctx = useThree()
let loaded = false

let lights = (scene: THREE.Scene) => {
  let dir = new THREE.DirectionalLight('#fff', 2)
  scene.add(dir)
  dir.position.set(1, 2, 1)
  dir.target
  
  let { shadow } = dir 
  shadow.bias = 0.00001
  shadow.mapSize.set(2048, 2048)
  shadow.normalBias = 0.02

  let { camera } = shadow
  camera.left = camera.bottom = -5
  camera.right = camera.top = 5
}

let dominantHand = 'right'
let nonDominantHand = 'left'

</script>

<a-scene
  reflection
  fog='far:5;color:{skyBlue}'
  shadow='type:pcfsoft'
  renderer='antialias:true;colorManagement:true;highRefreshRate:true;physicallyCorrectLights:true;toneMapping:ACESFilmic'
  on:loaded={(event) => {
    let scene = eventObject(event)
    let {renderer} = event.target
    ctx.scene = scene
    console.log(event.target.renderer)
    renderer.xr.setFoveation(1)
    try {
      renderer.xr.getSession().updateTargetFrameRate(120)
    } catch {}
    trees()
    armies()
    paths(scene, 1)
    paths(scene, -1)
    lights(scene)
    loaded = true
  }}
  on:enter-vr={() => $state = 'intro'}
>
  <a-sky color={skyBlue} />
  <a-light type='ambient' color='#445451' />

  <a-camera
    position='0 0.5 1.8'
    look-controls-enabled='false'
  />

  {#each [dominantHand, nonDominantHand] as hand}
    <a-entity
      visible={$state !== 'screen'}
      id='hand_{hand}'
      laser-controls='hand:{hand};model:false'
      raycaster='objects:.collidable;lineOpacity:0;autoRefresh:false'
    />
  {/each}

  {#if loaded}
    <a-cylinder
      radius={30}
      height={0.01}
      position='0 0 0'
      color={kellyGreen}
      class='collidable'
      raycasted
      on:intersection={(event) => console.log(event)}
    >
      <a-gltf-model
        src='castle-prod.glb'
        on:model-loaded={(event) => {
          let scepter = event.target.object3D.getObjectByName('scepter')
          scepter.position.set(0, 0, 0)
          window.hand_right.object3D.add(scepter)

          let orb = event.target.object3D.getObjectByName('orb')
          orb.position.set(0, 0, 0)
          window.hand_left.object3D.add(orb)

          shadows(ctx.scene)
        }}
      />
    </a-cylinder>

    {#if $state === 'screen'}
      <h1 class='fixed text-white text-9xl text-center w-screen'>
        <q>Keep Calm</q>
      </h1>

    {:else if ['intro', 'tutorial'].includes($state)}
      <Parchment>
        {#if $state === 'intro'}
        <div class='h-[900px] w-[1100px] text-5xl'>
          <p class='text-6xl'>Hail, my Liege.</p>
          <p class='mt-0 mb-16'>Thou art The King - if perchance you forgot again today.</p>
          <p>I must apprise thee that your chosen people are envied</p>
          <p class='mt-0 mb-16'>for being, well, chosen.</p>
          <p>Please muster thy utmost valor to defend them,</p>
          <p class='mt-0 mb-16'>they're all really good chaps once you get past the smell.</p>
          <p>Sincerely, thy most humble and abasing subject,</p>
          <p>Humphrey Bumblebuns, XO</p>
        </div>
        {/if}

        {#if $state === 'tutorial'}
        <div class='h-[900px] w-[1100px] text-5xl'>
          Pull the trigger on thy divine scepter to fire lasers. Hallowed by thy aim.

          Lobby thy royal orb at foes, and they shall surely bend the knee before the might of thy five megaton explosions.
        </div>
        {/if}
      </Parchment>
    {/if}
  {/if}
</a-scene>
