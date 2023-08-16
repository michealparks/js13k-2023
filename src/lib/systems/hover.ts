import type { ComponentDefinition } from 'aframe'
import { data, position, component } from '../helpers'

type Data = {
  /** Starting random value */
  s: number
  /** Initial y */
  y: number
}

component('hover', {
  update() {
    const d = data<Data>(this) 
    d.y = position(this).y
    d.s = Math.random() * 1000
  },
  tick(time) {
    const d = data<Data>(this)
    position(this).y = (Math.sin((d.s + time) / 1000) / 10) + d.y
  }
} satisfies ComponentDefinition)
