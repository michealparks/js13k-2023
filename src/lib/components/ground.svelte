<script lang='ts'>
  import { kellyGreen } from '../constants/colors'

  export let radius: number
  export let height: number
</script>

<a-cylinder
  {radius}
  {height}
  color={kellyGreen}
  {...$$restProps}
/>
