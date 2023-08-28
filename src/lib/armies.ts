
import { t, instancedMesh, meshStandardMat } from './util/three'
import { vec3, mat4 } from './math'
import { tan, brown } from './constants/colors'
import { useThree } from './hooks'

let count = 500
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

export let armies = () => {
  let { scene } = useThree()
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

  for (let i = 0, j = 0; i < count; i++, j += 2) {
    for (let part of parts) part.setMatrixAt(
      i,
      mat4.makeTranslation(
        vec3.set(positions[j]!, 0, positions[j + 1]!)
      )
    )
  }
}
