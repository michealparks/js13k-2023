
<script lang='ts'>
  export let height = 0.1
  export let radius = 0.01
  export let color: string
  export let position: string
</script>

<a-cylinder {position} {color} {height} {radius}>
  <a-sphere {color} radius={radius * 2.5} position='0 0.05 0' />
</a-cylinder>
