/* eslint-env jest */

import Segment from '../src/segment'
import SweepEvent from '../src/sweep-event'

describe('constructor', () => {
  test('general', () => {
    const leftSE = new SweepEvent({x: 0, y: 0})
    const rightSE = new SweepEvent({x: 1, y: 1})
    const ringsIn = []
    const seg = new Segment(leftSE, rightSE, ringsIn)
    expect(seg.ringsIn).toBe(ringsIn)
    expect(seg.leftSE).toBe(leftSE)
    expect(seg.leftSE.otherSE).toBe(rightSE)
    expect(seg.rightSE).toBe(rightSE)
    expect(seg.rightSE.otherSE).toBe(leftSE)
    expect(seg._cache).toEqual({})
    expect(seg.ringOut).toBe(undefined)
    expect(seg.prev).toBe(undefined)
    expect(seg.consumedBy).toBe(undefined)
  })
})

describe('fromRing', () => {
  test('correct point on left and right 1', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 0, y: 1 }
    const seg = Segment.fromRing(p1, p2)
    expect(seg.leftSE.point).toEqual(p1)
    expect(seg.rightSE.point).toEqual(p2)
  })

  test('correct point on left and right 1', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: -1, y: 0 }
    const seg = Segment.fromRing(p1, p2)
    expect(seg.leftSE.point).toEqual(p2)
    expect(seg.rightSE.point).toEqual(p1)
  })

  test('attempt create segment with same points', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 0, y: 0 }
    expect(() => Segment.fromRing(p1, p2)).toThrow()
  })
})

describe('split', () => {
  test('on interior point', () => {
    const seg = Segment.fromRing({ x: 0, y: 0 }, { x: 10, y: 10 }, true)
    const pt = { x: 5, y: 5 }
    const evts = seg.split([pt])
    expect(evts[0].segment).toBe(seg)
    expect(evts[0].point).toEqual(pt)
    expect(evts[0].isLeft).toBe(false)
    expect(evts[0].otherSE.otherSE).toBe(evts[0])
    expect(evts[1].segment.leftSE.segment).toBe(evts[1].segment)
    expect(evts[1].segment).not.toBe(seg)
    expect(evts[1].point).toEqual(pt)
    expect(evts[1].isLeft).toBe(true)
    expect(evts[1].otherSE.otherSE).toBe(evts[1])
    expect(evts[1].segment.rightSE.segment).toBe(evts[1].segment)
  })

  test('on close-to-but-not-exactly interior point', () => {
    const seg = Segment.fromRing({ x: 0, y: 10 }, { x: 10, y: 0 }, false)
    const pt = { x: 5 + Number.EPSILON, y: 5 }
    const evts = seg.split([pt])
    expect(evts[0].segment).toBe(seg)
    expect(evts[0].point).toEqual(pt)
    expect(evts[0].isLeft).toBe(false)
    expect(evts[1].segment).not.toBe(seg)
    expect(evts[1].point).toEqual(pt)
    expect(evts[1].isLeft).toBe(true)
    expect(evts[1].segment.rightSE.segment).toBe(evts[1].segment)
  })

  test('on three interior points', () => {
    const seg = Segment.fromRing({ x: 0, y: 0 }, { x: 10, y: 10 }, true)
    const [sPt1, sPt2, sPt3] = [{ x: 2, y: 2 }, { x: 4, y: 4 }, { x: 6, y: 6 }]

    const [orgLeftEvt, orgRightEvt] = [seg.leftSE, seg.rightSE]
    const newEvts = seg.split([sPt3, sPt1, sPt2])

    expect(newEvts.length).toBe(6)

    expect(seg.leftSE).toBe(orgLeftEvt)
    let evt = newEvts.find(e => e.point === sPt1 && ! e.isLeft)
    expect(seg.rightSE).toBe(evt)

    evt = newEvts.find(e => e.point === sPt1 && e.isLeft)
    let otherEvt = newEvts.find(e => e.point === sPt2 && ! e.isLeft)
    expect(evt.segment).toBe(otherEvt.segment)

    evt = newEvts.find(e => e.point === sPt2 && e.isLeft)
    otherEvt = newEvts.find(e => e.point === sPt3 && ! e.isLeft)
    expect(evt.segment).toBe(otherEvt.segment)

    evt = newEvts.find(e => e.point === sPt3 && e.isLeft)
    expect(evt.segment).toBe(orgRightEvt.segment)
  })
})

describe('simple properties - bbox, vector, points, isVertical', () => {
  test('general', () => {
    const seg = Segment.fromRing({ x: 1, y: 2 }, { x: 3, y: 4 })
    expect(seg.bbox()).toEqual({ ll: { x: 1, y: 2 }, ur: { x: 3, y: 4 } })
    expect(seg.vector()).toEqual({ x: 2, y: 2 })
    expect(seg.isVertical()).toBeFalsy()
  })

  test('horizontal', () => {
    const seg = Segment.fromRing({ x: 1, y: 4 }, { x: 3, y: 4 })
    expect(seg.bbox()).toEqual({ ll: { x: 1, y: 4 }, ur: { x: 3, y: 4 } })
    expect(seg.vector()).toEqual({ x: 2, y: 0 })
    expect(seg.isVertical()).toBeFalsy()
  })

  test('vertical', () => {
    const seg = Segment.fromRing({ x: 3, y: 2 }, { x: 3, y: 4 })
    expect(seg.bbox()).toEqual({ ll: { x: 3, y: 2 }, ur: { x: 3, y: 4 } })
    expect(seg.vector()).toEqual({ x: 0, y: 2 })
    expect(seg.isVertical()).toBeTruthy()
  })
})

describe('consume()', () => {
  test('not automatically consumed', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 1, y: 0 }
    const seg1 = Segment.fromRing(p1, p2, {id: 1})
    const seg2 = Segment.fromRing(p1, p2, {id: 2})
    expect(seg1.consumedBy).toBe(undefined)
    expect(seg2.consumedBy).toBe(undefined)
  })

  test('basic case', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 1, y: 0 }
    const seg1 = Segment.fromRing(p1, p2, {})
    const seg2 = Segment.fromRing(p1, p2, {})
    seg1.consume(seg2)
    expect(seg2.consumedBy).toBe(seg1)
    expect(seg1.consumedBy).toBe(undefined)
  })

  test('ealier in sweep line sorting consumes later', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 1, y: 0 }
    const seg1 = Segment.fromRing(p1, p2, {})
    const seg2 = Segment.fromRing(p1, p2, {})
    seg2.consume(seg1)
    expect(seg2.consumedBy).toBe(seg1)
    expect(seg1.consumedBy).toBe(undefined)
  })

  test('consuming cascades', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 0, y: 0 }
    const p3 = { x: 1, y: 0 }
    const p4 = { x: 1, y: 0 }
    const seg1 = Segment.fromRing(p1, p3, {})
    const seg2 = Segment.fromRing(p1, p3, {})
    const seg3 = Segment.fromRing(p2, p4, {})
    const seg4 = Segment.fromRing(p2, p4, {})
    const seg5 = Segment.fromRing(p2, p4, {})
    seg1.consume(seg2)
    seg4.consume(seg2)
    seg3.consume(seg2)
    seg3.consume(seg5)
    expect(seg1.consumedBy).toBe(undefined)
    expect(seg2.consumedBy).toBe(seg1)
    expect(seg3.consumedBy).toBe(seg1)
    expect(seg4.consumedBy).toBe(seg1)
    expect(seg5.consumedBy).toBe(seg1)
  })
})

describe('is an endpoint', () => {
  const p1 = { x: 0, y: -1 }
  const p2 = { x: 1, y: 0 }
  const seg = Segment.fromRing(p1, p2)

  test('yup', () => {
    expect(seg.isAnEndpoint(p1)).toBeTruthy()
    expect(seg.isAnEndpoint(p2)).toBeTruthy()
  })

  test('nope', () => {
    expect(seg.isAnEndpoint({ x: -34, y: 46 })).toBeFalsy()
    expect(seg.isAnEndpoint({ x: 0, y: 0 })).toBeFalsy()
  })
})

describe('is Point On', () => {
  const p1 = { x: -1, y: -1 }
  const p2 = { x: 1, y: 1 }
  const seg = Segment.fromRing(p1, p2)

  test('yup', () => {
    expect(seg.isPointOn(p1)).toBeTruthy()
    expect(seg.isPointOn(p2)).toBeTruthy()
    expect(seg.isPointOn({ x: 0, y: 0 })).toBeTruthy()
    expect(seg.isPointOn({ x: 0.5, y: 0.5 })).toBeTruthy()
  })

  test('nope', () => {
    expect(seg.isPointOn({ x: -234, y: 23421 })).toBeFalsy()
  })

  test('nope really close', () => {
    expect(seg.isPointOn({ x: 0, y: Number.EPSILON })).toBeFalsy()
  })
})

describe('comparison with point', () => {
  test('general', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const s2 = Segment.fromRing({ x: 0, y: 1 }, { x: 0, y: 0 })

    expect(s1.comparePoint({ x: 0, y: 1 })).toBe(1)
    expect(s1.comparePoint({ x: 1, y: 2 })).toBe(1)
    expect(s1.comparePoint({ x: 0, y: 0 })).toBe(0)
    expect(s1.comparePoint({ x: 5, y: -1 })).toBe(-1)

    expect(s2.comparePoint({ x: 0, y: 1 })).toBe(0)
    expect(s2.comparePoint({ x: 1, y: 2 })).toBe(-1)
    expect(s2.comparePoint({ x: 0, y: 0 })).toBe(0)
    expect(s2.comparePoint({ x: 5, y: -1 })).toBe(-1)
  })

  test('barely above', () => {
    const s1 = Segment.fromRing({ x: 1, y: 1 }, { x: 3, y: 1 })
    const pt = { x: 2, y: 1 - Number.EPSILON }
    expect(s1.comparePoint(pt)).toBe(-1)
  })

  test('barely below', () => {
    const s1 = Segment.fromRing({ x: 1, y: 1 }, { x: 3, y: 1 })
    const pt = { x: 2, y: 1 + Number.EPSILON * 3 / 2 }
    expect(s1.comparePoint(pt)).toBe(1)
  })
})

/**
 * These tests ensures that these two methods produce consistent results.
 *
 * Deciding whether a point is on an infinitely thin line is a tricky question
 * in a floating point world. Previously, these two methods were coming to
 * different conclusions for the these points.
 */
describe('consistency between isPointOn() and getIntersections()', () => {
  test('t-intersection on endpoint', () => {
    const pt = {x: -104.0626, y: 75.4279525872937}
    const s1 = Segment.fromRing({x: -104.117212, y: 75.4383502}, {x: -104.0624, y: 75.4279145091691})
    const s2 = Segment.fromRing(pt, {x: -104.0625, y: 75.44})

    const inters1 = s1.getIntersections(s2)
    expect(inters1.length).toBe(1)
    expect(inters1[0].x).toBe(pt.x)
    expect(inters1[0].y).toBe(pt.y)

    const inters2 = s2.getIntersections(s1)
    expect(inters2.length).toBe(1)
    expect(inters2[0].x).toBe(pt.x)
    expect(inters2[0].y).toBe(pt.y)

    expect(s1.isPointOn(pt)).toBe(true)
    expect(s2.isPointOn(pt)).toBe(true)
  })

  test('two intersections on endpoints, overlapping parrallel segments', () => {
    const pt1 = {x: -104.0624, y: 75.4279145091691}
    const pt2 = {x: -104.0626, y: 75.4279525872937}
    const s1 = Segment.fromRing({x: -104.117212, y: 75.4383502}, pt1)
    const s2 = Segment.fromRing(pt2, {x: -104.0529352, y: 75.4261125})

    const inters1 = s1.getIntersections(s2)
    expect(inters1.length).toBe(2)
    expect(inters1[0].x).toBe(pt2.x)
    expect(inters1[0].y).toBe(pt2.y)
    expect(inters1[1].x).toBe(pt1.x)
    expect(inters1[1].y).toBe(pt1.y)

    const inters2 = s2.getIntersections(s1)
    expect(inters2.length).toBe(2)
    expect(inters2[0].x).toBe(pt2.x)
    expect(inters2[0].y).toBe(pt2.y)
    expect(inters2[1].x).toBe(pt1.x)
    expect(inters2[1].y).toBe(pt1.y)

    expect(s1.isPointOn(pt1)).toBe(true)
    expect(s1.isPointOn(pt2)).toBe(true)

    expect(s2.isPointOn(pt1)).toBe(true)
    expect(s2.isPointOn(pt2)).toBe(true)
  })
})

describe('get intersections 2', () => {
  test('colinear full overlap', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const s2 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const inters = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('colinear partial overlap upward slope', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 2, y: 2 })
    const s2 = Segment.fromRing({ x: 1, y: 1 }, { x: 3, y: 3 })
    const inters = [{ x: 1, y: 1 }, { x: 2, y: 2 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('colinear partial overlap downward slope', () => {
    const s1 = Segment.fromRing({ x: 0, y: 2 }, { x: 2, y: 0 })
    const s2 = Segment.fromRing({ x: -1, y: 3 }, { x: 1, y: 1 })
    const inters = [{ x: 0, y: 2 }, { x: 1, y: 1 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('colinear partial overlap horizontal', () => {
    const s1 = Segment.fromRing({ x: 0, y: 1 }, { x: 2, y: 1 })
    const s2 = Segment.fromRing({ x: 1, y: 1 }, { x: 3, y: 1 })
    const inters = [{ x: 1, y: 1 }, { x: 2, y: 1 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('colinear partial overlap vertical', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 0, y: 3 })
    const s2 = Segment.fromRing({ x: 0, y: 2 }, { x: 0, y: 4 })
    const inters = [{ x: 0, y: 2 }, { x: 0, y: 3 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('colinear endpoint overlap', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const s2 = Segment.fromRing({ x: 1, y: 1 }, { x: 2, y: 2 })
    const inters = [{ x: 1, y: 1 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('colinear no overlap', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const s2 = Segment.fromRing({ x: 3, y: 3 }, { x: 4, y: 4 })
    const inters = []
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('parallel no overlap', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const s2 = Segment.fromRing({ x: 0, y: 3 }, { x: 1, y: 4 })
    const inters = []
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('intersect general', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 2, y: 2 })
    const s2 = Segment.fromRing({ x: 0, y: 2 }, { x: 2, y: 0 })
    const inters = [{ x: 1, y: 1 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('T-intersect with an endpoint', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 2, y: 2 })
    const s2 = Segment.fromRing({ x: 1, y: 1 }, { x: 5, y: 4 })
    const inters = [{ x: 1, y: 1 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('intersect with vertical', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 5, y: 5 })
    const s2 = Segment.fromRing({ x: 3, y: 0 }, { x: 3, y: 44 })
    const inters = [{ x: 3, y: 3 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('intersect with horizontal', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 5, y: 5 })
    const s2 = Segment.fromRing({ x: 0, y: 3 }, { x: 23, y: 3 })
    const inters = [{ x: 3, y: 3 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('horizontal and vertical T-intersection', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 5, y: 0 })
    const s2 = Segment.fromRing({ x: 3, y: 0 }, { x: 3, y: 5 })
    const inters = [{ x: 3, y: 0 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('horizontal and vertical general intersection', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 5, y: 0 })
    const s2 = Segment.fromRing({ x: 3, y: -5 }, { x: 3, y: 5 })
    const inters = [{ x: 3, y: 0 }]
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('no intersection not even close', () => {
    const s1 = Segment.fromRing({ x: 1000, y: 10002 }, { x: 2000, y: 20002 })
    const s2 = Segment.fromRing({ x: -234, y: -123 }, { x: -12, y: -23 })
    const inters = []
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('no intersection kinda close', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
    const s2 = Segment.fromRing({ x: 0, y: 10 }, { x: 10, y: 0 })
    const inters = []
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('no intersection with vertical touching bbox', () => {
    const s1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
    const s2 = Segment.fromRing({ x: 2, y: -5 }, { x: 2, y: 0 })
    const inters = []
    expect(s1.getIntersections(s2)).toEqual(inters)
    expect(s2.getIntersections(s1)).toEqual(inters)
  })

  test('shared point 1', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({ x: 0, y: 1 }, { x: 0, y: 0 })
    const inters = [{ x: 0, y: 0 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('shared point 2', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({x: 0, y: 1 }, { x: 1, y: 1 })
    const inters = [{ x: 1, y: 1 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('T-crossing', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({ x: 0.5, y: 0.5 }, { x: 1, y: 0 })
    const inters = [{ x: 0.5, y: 0.5 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('full overlap', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 10, y: 10 })
    const b = Segment.fromRing({ x: 1, y: 1 }, { x: 5, y: 5 })
    const inters = [{ x: 1, y: 1 }, { x: 5, y: 5 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('shared point + overlap', () => {
    const a = Segment.fromRing({ x: 1, y: 1 }, { x: 10, y: 10 })
    const b = Segment.fromRing({ x: 1, y: 1 }, { x: 5, y: 5 })
    const inters = [{ x: 1, y: 1 }, { x: 5, y: 5 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('mutual overlap', () => {
    const a = Segment.fromRing({ x: 3, y: 3 }, { x: 10, y: 10 })
    const b = Segment.fromRing({ x: 0, y: 0 }, { x: 5, y: 5 })
    const inters = [{ x: 3, y: 3 }, { x: 5, y: 5 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('full overlap', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const inters = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('full overlap, orientation', () => {
    const a = Segment.fromRing({ x: 1, y: 1 }, { x: 0, y: 0 })
    const b = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const inters = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('colinear, shared point', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({ x: 1, y: 1 }, { x: 2, y: 2 })
    const inters = [{ x: 1, y: 1 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('colinear, shared other point', () => {
    const a = Segment.fromRing({ x: 1, y: 1 }, { x: 0, y: 0 })
    const b = Segment.fromRing({ x: 1, y: 1 }, { x: 2, y: 2 })
    const inters = [{ x: 1, y: 1 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('colinear, one encloses other', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
    const b = Segment.fromRing({ x: 1, y: 1 }, { x: 2, y: 2 })
    const inters = [{ x: 1, y: 1 }, { x: 2, y: 2 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('colinear, one encloses other 2', () => {
    const a = Segment.fromRing({ x: 4, y: 0 }, { x: 0, y: 4 })
    const b = Segment.fromRing({ x: 3, y: 1 }, { x: 1, y: 3 })
    const inters = [{ x: 1, y: 3 }, { x: 3, y: 1 }]
    expect(a.getIntersections(b)).toEqual(inters)
    expect(b.getIntersections(a)).toEqual(inters)
  })

  test('colinear, no overlap', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({ x: 2, y: 2 }, { x: 4, y: 4 })
    expect(a.getIntersections(b)).toEqual([])
    expect(b.getIntersections(a)).toEqual([])
  })

  test('parallel', () => {
    const a = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    const b = Segment.fromRing({ x: 0, y: -1 }, { x: 1, y: 0 })
    expect(a.getIntersections(b)).toEqual([])
    expect(b.getIntersections(a)).toEqual([])
  })

  test('parallel, orientation', () => {
    const a = Segment.fromRing({ x: 1, y: 1 }, { x: 0, y: 0 })
    const b = Segment.fromRing({ x: 0, y: -1 }, { x: 1, y: 0 })
    expect(a.getIntersections(b)).toEqual([])
    expect(b.getIntersections(a)).toEqual([])
  })

  test('parallel, position', () => {
    const a = Segment.fromRing({ x: 0, y: -1 }, { x: 1, y: 0 })
    const b = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    expect(a.getIntersections(b)).toEqual([])
    expect(b.getIntersections(a)).toEqual([])
  })
})

describe('compare segments', () => {
  describe('non intersecting', () => {
    test('not in same vertical space', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
      const seg2 = Segment.fromRing({ x: 4, y: 3 }, { x: 6, y: 7 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('in same vertical space, earlier is below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: -4 })
      const seg2 = Segment.fromRing({ x: 1, y: 1 }, { x: 6, y: 7 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('in same vertical space, later is below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: -4 })
      const seg2 = Segment.fromRing({ x: -5, y: -5 }, { x: 6, y: -7 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('with left points in same vertical line', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: 0, y: -1 }, { x: -5, y: -5 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('with earlier right point directly under later left point', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: -5, y: -5 }, { x: 0, y: -3 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('with eariler right point directly over earlier left point', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: -5, y: 5 }, { x: 0, y: 3 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })
  })

  describe('intersecting not on endpoint', () => {
    test('earlier comes up from before & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: -1, y: -5 }, { x: 1, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('earlier comes up from directly over & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 0, y: -2 }, { x: 3, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('earlier comes up from after & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 1, y: -2 }, { x: 3, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('later comes down from before & above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: -1, y: 5 }, { x: 1, y: -2 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('later comes up from directly over & above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 0, y: 2 }, { x: 3, y: -2 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('later comes up from after & above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 1, y: 2 }, { x: 3, y: -2 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })
  })

  describe('intersect but not share on an endpoint', () => {
    test('intersect on right', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 2, y: -2 }, { x: 6, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('intersect on left from above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: -2, y: 2 }, { x: 2, y: -2 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('intersect on left from below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: -2, y: -2 }, { x: 2, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })
  })

  describe('share right endpoint', () => {
    test('earlier comes up from before & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: -1, y: -5 }, { x: 4, y: 0 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('earlier comes up from directly over & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 0, y: -2 }, { x: 4, y: 0 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('earlier comes up from after & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 1, y: -2 }, { x: 4, y: 0 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('later comes down from before & above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: -1, y: 5 }, { x: 4, y: 0 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('laterjcomes up from directly over & above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 0, y: 2 }, { x: 4, y: 0 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })

    test('later comes up from after & above', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 0 })
      const seg2 = Segment.fromRing({ x: 1, y: 2 }, { x: 4, y: 0 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)
    })
  })

  describe('share left endpoint but not colinear', () => {
    test('earlier comes up from before & below', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('one vertical, other not', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 0, y: 4 })
      const seg2 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })
  })

  describe('colinear', () => {
    test('partial mutal overlap', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: -1, y: -1 }, { x: 2, y: 2 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('complete overlap', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: -1, y: -1 }, { x: 5, y: 5 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('right endpoints match', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 })
      const seg2 = Segment.fromRing({ x: -1, y: -1 }, { x: 4, y: 4 })
      expect(Segment.compare(seg1, seg2)).toBe(1)
      expect(Segment.compare(seg2, seg1)).toBe(-1)
    })

    test('left endpoints match - should be sorted by ring id', () => {
      const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 }, { id: 1 })
      const seg2 = Segment.fromRing({ x: 0, y: 0 }, { x: 3, y: 3 }, { id: 2 })
      const seg3 = Segment.fromRing({ x: 0, y: 0 }, { x: 5, y: 5 }, { id: 3 })
      expect(Segment.compare(seg1, seg2)).toBe(-1)
      expect(Segment.compare(seg2, seg1)).toBe(1)

      expect(Segment.compare(seg2, seg3)).toBe(-1)
      expect(Segment.compare(seg3, seg2)).toBe(1)

      expect(Segment.compare(seg1, seg3)).toBe(-1)
      expect(Segment.compare(seg3, seg1)).toBe(1)
    })
  })

  test('exactly equal segments should be sorted by ring id', () => {
    const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 }, { id: 1 })
    const seg2 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 }, { id: 2 })
    expect(Segment.compare(seg1, seg2)).toBe(-1)
    expect(Segment.compare(seg2, seg1)).toBe(1)
  })

  test('exactly equal segments (but not identical) are consistent', () => {
    const seg1 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 }, { id: 1 })
    const seg2 = Segment.fromRing({ x: 0, y: 0 }, { x: 4, y: 4 }, { id: 1 })
    const result = Segment.compare(seg1, seg2)
    expect(Segment.compare(seg1, seg2)).toBe(result)
    expect(Segment.compare(seg2, seg1)).toBe(result * -1)
  })
})

describe('isOrientationCorrect()', () => {
  test('yes', () => {
    const seg = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    expect(seg.isOrientationCorrect()).toBe(true)
  })

  test('no', () => {
    const seg = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    seg.leftSE.point.x = 42
    expect(seg.isOrientationCorrect()).toBe(false)
  })

  test('degenerate segment', () => {
    const seg = Segment.fromRing({ x: 0, y: 0 }, { x: 1, y: 1 })
    seg.leftSE.point.x = 1
    seg.leftSE.point.y = 1
    expect(() => seg.isOrientationCorrect()).toThrow()
  })
})
