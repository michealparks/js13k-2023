import { kellyGreen, skyBlue } from '../constants/colors'
import { append, create } from '../dom'

const ground = (radius: number, height: number, position: string) => create('a-cylinder', {
  radius,
  height,
  position,
  color: kellyGreen,
})

append(create('a-sky', { color: skyBlue }))

append(ground(3, 0.01, '0 0.8 0'))
append(ground(1.5, 0.2, '0 1 0'))
append(ground(0.9, 0.2, '0 1.2 0'))
