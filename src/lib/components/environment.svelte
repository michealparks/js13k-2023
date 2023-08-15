<script lang='ts'>
  import { skyBlue } from '../constants/colors'
  import Ground from './ground.svelte';
</script>

<a-sky color={skyBlue} />

<Ground radius={3} height={0.01} position='0 0.8 0' />
<Ground radius={1.5} height={0.2} position='0 1 0' />
<Ground radius={0.9} height={0.2} position='0 1.2 0' /> 
