import { append, create } from "../dom";

const light = (type: string, intensity: number, color: string, props?: any) =>
  create('a-light', { type, intensity, color, ...props })

append(light('ambient', 10, '#445451'))
append(light('directional', 10, '#445451', { position: '2 4 4'}))