import { cmp } from './flp'

/* Cross Product of two vectors with first point at origin */
export const crossProduct = (a, b) => a.x * b.y - a.y * b.x

/* Dot Product of two vectors with first point at origin */
export const dotProduct = (a, b) => a.x * b.x + a.y * b.y

/* Comparator for two vectors with same starting point */
export const compareVectorAngles = (basePt, endPt1, endPt2) => {
  const v1 = { x: endPt1.x - basePt.x, y: endPt1.y - basePt.y }
  const v2 = { x: endPt2.x - basePt.x, y: endPt2.y - basePt.y }
  const kross = crossProduct(v1, v2)
  return cmp(kross, 0)
}

export const length = v => Math.sqrt(dotProduct(v, v))

/* Get the sine of the angle from pShared -> pAngle to pShaed -> pBase */
export const sineOfAngle = (pShared, pBase, pAngle) => {
  const vBase = { x: pBase.x - pShared.x, y: pBase.y - pShared.y }
  const vAngle = { x: pAngle.x - pShared.x, y: pAngle.y - pShared.y }
  return crossProduct(vAngle, vBase) / length(vAngle) / length(vBase)
}

/* Get the cosine of the angle from pShared -> pAngle to pShaed -> pBase */
export const cosineOfAngle = (pShared, pBase, pAngle) => {
  const vBase = { x: pBase.x - pShared.x, y: pBase.y - pShared.y }
  const vAngle = { x: pAngle.x - pShared.x, y: pAngle.y - pShared.y }
  return dotProduct(vAngle, vBase) / length(vAngle) / length(vBase)
}

/* Get the x coordinate where the given line (defined by a point and vector)
 * crosses the horizontal line with the given y coordiante.
 * In the case of parrallel lines (including overlapping ones) returns null. */
export const horizontalIntersection = (pt, v, y) => {
  if (v.y === 0) return null
  return { x: pt.x + v.x / v.y * ( y - pt.y ), y: y }
}

/* Get the y coordinate where the given line (defined by a point and vector)
 * crosses the vertical line with the given x coordiante.
 * In the case of parrallel lines (including overlapping ones) returns null. */
export const verticalIntersection = (pt, v, x) => {
  if (v.x === 0) return null
  return { x: x, y: pt.y + v.y / v.x * ( x - pt.x ) }
}

/* Get the intersection of two lines, each defined by a base point and a vector.
 * In the case of parrallel lines (including overlapping ones) returns null. */
export const intersection = (pt1, v1, pt2, v2) => {
  // take some shortcuts for vertical and horizontal lines
  // this also ensures we don't calculate an intersection and then discover
  // it's actually outside the bounding box of the line
  if (v1.x === 0) return verticalIntersection(pt2, v2, pt1.x)
  if (v2.x === 0) return verticalIntersection(pt1, v1, pt2.x)
  if (v1.y === 0) return horizontalIntersection(pt2, v2, pt1.y)
  if (v2.y === 0) return horizontalIntersection(pt1, v1, pt2.y)

  // General case for non-overlapping segments.
  // This algorithm is based on Schneider and Eberly.
  // http://www.cimec.org.ar/~ncalvo/Schneider_Eberly.pdf - pg 244

  const kross = crossProduct(v1, v2)
  if (kross == 0) return null

  const ve = { x: pt2.x - pt1.x, y: pt2.y - pt1.y }
  const d1 = crossProduct(ve, v1) / kross
  const d2 = crossProduct(ve, v2) / kross

  // take the average of the two calculations to minimize rounding error
  let x = (pt1.x + d2 * v1.x + pt2.x + d1 * v2.x) / 2
  let y = (pt1.y + d2 * v1.y + pt2.y + d1 * v2.y) / 2
  return { x: x, y: y }
}

/* Given a vector, return one that is perpendicular */
export const perpendicular = (v) => {
  return { x: -v.y, y: v.x }
}
