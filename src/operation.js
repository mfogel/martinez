import SplayTree from 'splaytree'
import * as cleanInput from './clean-input'
import * as geomIn from './geom-in'
import * as geomOut from './geom-out'
import SweepEvent from './sweep-event'
import SweepLine from './sweep-line'

export class Operation {
  run (type, geom, moreGeoms) {
    operation.type = type

    /* Make a copy of the input geometry with points as objects, for perf */
    const geoms = [cleanInput.pointsAsObjects(geom)]
    for (let i = 0, iMax = moreGeoms.length; i < iMax; i++) {
      geoms.push(cleanInput.pointsAsObjects(moreGeoms[i]))
    }

    /* Clean inputs */
    for (let i = 0, iMax = geoms.length; i < iMax; i++) {
      cleanInput.forceMultiPoly(geoms[i])
      cleanInput.cleanMultiPoly(geoms[i])
    }

    /* Convert inputs to MultiPoly objects, mark subject */
    const multipolys = []
    for (let i = 0, iMax = geoms.length; i < iMax; i++) {
      multipolys.push(new geomIn.MultiPolyIn(geoms[i]))
    }
    multipolys[0].markAsSubject()
    operation.numMultiPolys = multipolys.length

    /* Put segment endpoints in a priority queue */
    const queue = new SplayTree(SweepEvent.compare)
    for (let i = 0, iMax = multipolys.length; i < iMax; i++) {
      const sweepEvents = multipolys[i].getSweepEvents()
      for (let j = 0, jMax = sweepEvents.length; j < jMax; j++) {
        queue.insert(sweepEvents[j])
      }
    }

    /* Pass the sweep line over those endpoints */
    const sweepLine = new SweepLine()
    let node
    while (node = queue.pop()) {
      const newEvents = sweepLine.process(node.key)
      for (let i = 0, iMax = newEvents.length; i < iMax; i++) {
        queue.insert(newEvents[i])
      }
    }

    /* Collect and compile segments we're keeping into a multipolygon */
    const ringsOut = geomOut.RingOut.factory(sweepLine.segments)
    const result = new geomOut.MultiPolyOut(ringsOut)
    return result.getGeom()
  }
}

// singleton available by import
const operation = new Operation()

export default operation
