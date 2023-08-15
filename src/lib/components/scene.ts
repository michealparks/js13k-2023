import { shadows } from '../../lib/shadows'
import { append, on, create } from '../dom'

export let scene = append(
  on(
    create('a-scene', {
      renderer: 'antialias:true;colorManagement:true;highRefreshRate:true;physicallyCorrectLights:true;toneMapping:ACESFilmic',
      'vr-mode-ui': 'enterVRButton:#btn',
    }),
    'loaded',
    (event) => shadows(event.target.object3D)
  ), document.body
)
