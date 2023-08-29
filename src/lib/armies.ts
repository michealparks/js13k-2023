
import { t, instancedMesh, meshStandardMat } from './util/three'
import { vec3, mat4, dummy } from './util/math'
import { tan, brown } from './constants/colors'
import { useFrame } from './components/frame'
import { curves } from './paths'

let count = 1000
let defaultSize = 0.1

const boxes = (
  width = defaultSize,
  height = defaultSize,
  depth = defaultSize,
  x = 0,
  y = 0,
  z = 0,
  color: string
) => {
  return instancedMesh(
    new t.BoxGeometry(width, height, depth).translate(x, y, z),
    meshStandardMat({ color }),
    count
  )
}

export let armies = (scene: THREE.Scene) => {
  let headsize = 0.01
  let heads = boxes(headsize, headsize, headsize, 0, 0.04, 0, tan)

  let torsoWidth = 0.02
  let torsoHeight = 0.03
  let torsoDepth = 0.004
  let torsos = boxes(torsoWidth, torsoHeight, torsoDepth, 0, 0.02, 0, brown)

  let armWidth = 0.005
  let armLength = 0.0175
  let armX = 0.012
  let armY = 0.025
  let leftArms = boxes(armWidth, armLength, armWidth, -armX, armY, 0, tan)
  let rightArms = boxes(armWidth, armLength, armWidth, armX, armY, 0, tan)

  let parts = [heads, torsos, leftArms, rightArms]

  let positions = new Float32Array(count * 2)

  for (let i = 0; i < count * 2; i += 2) {
    positions[i + 1] = 0.25 + (i * 0.02)
  }

  scene.add(...parts)

  useFrame((time) => {
    let t = time / 70_000
    
    for (let i = 0, j = 0; i < count; i++, j += 2) {
      let offset = i / 200

      
      curves[i % 2]!.smoothPath.getPointAt(1 - ((t + offset) % 1), dummy.position)
      curves[i % 2]!.smoothPath.getPointAt(1 - ((t + offset + 0.01) % 1), vec3)
      
      dummy.position.y = (Math.sin(time / 50) / 300) + 0.015
      dummy.lookAt(vec3.x, 0.03, vec3.z)
      dummy.updateMatrix()

      for (let part of parts)
        part.setMatrixAt(i, dummy.matrix)
    }

    for (let part of parts)
      part.instanceMatrix.needsUpdate = true
  })
}
