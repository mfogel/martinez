const fs = require('fs')
const path = require('path')
const load = require('load-json-file')
const Benchmark = require('benchmark')
const jstsUnion = require('@turf/union')
const w8r = require('martinez-polygon-clipping')
const mfogel = require('../main')

/**
 * Benchmark results ( c9b02e5 )
 * 
 * Hole_Hole
 * mfogel x 5,155 ops/sec ±0.56% (92 runs sampled)
 * w8r x 37,182 ops/sec ±1.05% (95 runs sampled)
 * JSTS x 2,259 ops/sec ±6.95% (84 runs sampled)
 * - Fastest is w8r
 * 
 * Asia union
 * mfogel x 5.81 ops/sec ±2.74% (18 runs sampled)
 * w8r x 13.05 ops/sec ±4.98% (37 runs sampled)
 * JSTS x 8.71 ops/sec ±5.38% (26 runs sampled)
 * - Fastest is w8r
 * 
 * States clip
 * mfogel x 98.03 ops/sec ±1.78% (72 runs sampled)
 * w8r x 284 ops/sec ±4.36% (84 runs sampled)
 * JSTS x 112 ops/sec ±2.20% (82 runs sampled)
 * - Fastest is w8r
 */

const options = {
  onStart (event) { console.log(this.name) },
  onError (event) { console.log(event.target.error) },
  onCycle (event) { console.log(String(event.target)) },
  onComplete() {
    console.log('- Fastest is ' + this.filter('fastest').map('name') + '\n')
  }
}

const hole_hole = load.sync('./bench/fixtures/hole_hole.geojson')
const hole_hole_obj_0 = mfogel.toObjects(hole_hole.features[0].geometry.coordinates)
const hole_hole_obj_1 = mfogel.toObjects(hole_hole.features[1].geometry.coordinates)
new Benchmark.Suite('Hole_Hole', options)
  .add('mfogel', () => {
    mfogel.union(hole_hole_obj_0, hole_hole_obj_1)
  })
  .add('w8r', () => {
    w8r.union(
      hole_hole.features[0].geometry.coordinates,
      hole_hole.features[1].geometry.coordinates)
  })
  .add('JSTS', () => {
    jstsUnion(hole_hole.features[0], hole_hole.features[1])
  })
  .run()

const asia = load.sync('./bench/fixtures/asia.geojson')
const unionPoly = load.sync('./bench/fixtures/asia_unionPoly.geojson')
const asia_obj = mfogel.toObjects(asia.features[0].geometry.coordinates)
const union_obj = mfogel.toObjects(unionPoly.geometry.coordinates)
new Benchmark.Suite('Asia union', options)
  .add('mfogel', () => {
    mfogel.union(asia_obj, union_obj)
  })
  .add('w8r', () => {
    w8r.union(
      asia.features[0].geometry.coordinates,
      unionPoly.geometry.coordinates)
  })
  .add('JSTS', () => jstsUnion(asia.features[0], unionPoly))
  .run()

const states = load.sync('./bench/fixtures/states_source.geojson')
const states_obj_0 = mfogel.toObjects(states.features[0].geometry.coordinates)
const states_obj_1 = mfogel.toObjects(states.features[1].geometry.coordinates)
new Benchmark.Suite('States clip', options)
  .add('mfogel', () => {
    mfogel.union(states_obj_0, states_obj_1)
  })
  .add('w8r', () => {
    w8r.union(
      states.features[0].geometry.coordinates,
      states.features[1].geometry.coordinates)
  })
  .add('JSTS', () => {
    jstsUnion(states.features[0], states.features[1])
  })
  .run()
