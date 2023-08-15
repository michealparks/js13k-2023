
<script lang='ts'>
  export let color: string
  export let height = 0.1
  export let radius = 0.01
</script>


<a-cylinder {...$$restProps} {color} {height} {radius}>
  <a-sphere {color} radius={radius * 2.5} position='0 0.05 0' />
</a-cylinder>
