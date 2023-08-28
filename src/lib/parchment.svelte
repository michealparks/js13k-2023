<script lang='ts'>

import { onMount } from 'svelte'
import { html2canvas } from './html2canvas'
import { useThree } from './hooks'
import { t, plane } from './util/three'

let container: HTMLElement

onMount(() => {
  let canvas = html2canvas(container)
  let { scene } = useThree()

  let map = new t.CanvasTexture(canvas)
  map.anisotropy = 4

  let text = plane(0.4, 0.4, { map, transparent: true })
  text.position.z = 0.001
  let bg = plane(0.4, 0.4, { color: '#fff' })
  bg.position.set(0, 1, 0)
  bg.rotation.x = -Math.PI / 4

  bg.add(text)
  scene.add(bg)
})

</script>

<div
  bind:this={container}
  class='absolute -top-full -left-full px-24 py-24'
>
  <slot />
</div>
