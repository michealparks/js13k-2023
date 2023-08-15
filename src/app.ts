import './app.css'
import 'https://cdn.jsdelivr.net/gh/aframevr/aframe@ef03254934395d6a0a3cd093a8d37bb90790d24e/dist/aframe-master.min.js'
import { create, append } from './lib/dom'

import './lib/components/scene'
import './lib/components/environment'
import './lib/components/lights'

append(create('button', {
  id: 'btn',
  class: 'bg-black z-10 bg-opacity-50 border border-white text-white px-8 py-3 cursor-pointer text-lg'
}, 'start'), document.body)
