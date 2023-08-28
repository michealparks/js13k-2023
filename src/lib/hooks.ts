let ctx = {
  scene: undefined! as THREE.Scene
}

let fns: (() => void)[] = []

export let useThree = () => ctx
export let useFrame = (fn: () => void) => fns.push(fn)
