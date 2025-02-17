/* global it, describe */
var diff = require('../lib/diff.js')
var chai = require('chai')
chai.should()

describe('List diff', function () {
  function perform (list, moves) {
    moves.moves.forEach(function (move) {
      if (move.type) {
        list.splice(move.index, 0, move.item)
      } else {
        list.splice(move.index, 1)
      }
    })
    return list
  }

  function assertListEqual (after, before) {
    after.forEach(function (item, i) {
      after[i].should.be.deep.equal(before[i])
    })
  }

  function random (len) {
    return Math.floor(Math.random() * len)
  }

  it('Making map from list with string key', function () {
    var list = [{key: 'id1'}, {key: 'id2'}, {key: 'id3'}, {key: 'id4'}]
    var map = diff.makeKey2Index(list, 'key')
    map.should.be.deep.equal({
      id1: 0,
      id2: 1,
      id3: 2,
      id4: 3
    })
  })

  it('Making map from list with function', function () {
    var list = [{key: 'id1'}, {key: 'id2'}, {key: 'id3'}, {key: 'id4'}]
    var map = diff.makeKey2Index(list, function (item) {
      return item.key
    })
    map.should.be.deep.equal({
      id1: 0,
      id2: 1,
      id3: 2,
      id4: 3
    })
  })

  it('Removing items', function () {
    var before = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}]
    var after = [{id: 2}, {id: 3}, {id: 1}]
    var diffs = diff.diff(before, after, 'id')
    diffs.moves.length.should.be.equal(5)
    perform(before, diffs)
    diffs.children.should.be.deep.equal([{id: 1}, {id: 2}, {id: 3}, null, null, null])
    diffs.noChangeChildren.should.be.deep.equal([[{ id: 2 }, { id: 2 }], [{ id: 3 }, { id: 3 }]])
    assertListEqual(after, before)
  })

  it('Removing items in the middel', function () {
    var before = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}]
    var after = [{id: 1}, {id: 2}, {id: 4}, {id: 6}]
    var diffs = diff.diff(before, after, 'id')
    perform(before, diffs)
    diffs.children.should.be.deep.equal([{id: 1}, {id: 2}, null, {id: 4}, null, {id: 6}])
    diffs.noChangeChildren.should.be.deep.equal([
      [{ id: 1 }, { id: 1 }],
      [{ id: 2 }, { id: 2 }],
      [{ id: 4 }, { id: 4 }],
      [{ id: 6 }, { id: 6 }],
    ])
    diffs.moves.length.should.be.equal(2)
    assertListEqual(after, before)
  })

  it('Inserting items', function () {
    var before = ['a', 'b', 'c', 'd']
    var after = ['a', 'b', 'e', 'f', 'c', 'd']
    var diffs = diff.diff(before, after, function (item) { return item })
    diffs.moves.length.should.be.equal(2)
    diffs.children.should.be.deep.equal(['a', 'b', 'c', 'd'])
    diffs.noChangeChildren.should.be.deep.equal([
      ['a', 'a'],
      ['b', 'b'],
      ['c', 'c'],
      ['d', 'd'],
    ])
    perform(before, diffs)
    assertListEqual(after, before)
  })

  it('Moving items from back to front', function () {
    var before = ['a', 'b', 'c', 'd', 'e', 'f']
    var after = ['a', 'b', 'e', 'f', 'c', 'd', 'g', 'h']
    var diffs = diff.diff(before, after, function (item) { return item })
    diffs.moves.length.should.be.equal(6)
    diffs.children.should.be.deep.equal(['a', 'b', 'c', 'd', 'e', 'f'])
    diffs.noChangeChildren.should.be.deep.equal([
      ['a', 'a'],
      ['b', 'b'],
      ['c', 'c'],
      ['d', 'd'],
    ])
    perform(before, diffs)
    assertListEqual(after, before)
  })

  it('Moving items from front to back', function () {
    var before = ['a', 'b', 'c', 'd', 'e', 'f']
    var after = ['a', 'c', 'e', 'f', 'b', 'd']
    var diffs = diff.diff(before, after, function (item) { return item })
    diffs.moves.length.should.be.equal(4)
    diffs.children.should.be.deep.equal(['a', 'b', 'c', 'd', 'e', 'f'])
    diffs.noChangeChildren.should.be.deep.equal([
      ['a', 'a'],
      ['c', 'c'],
      ['e', 'e'],
      ['f', 'f'],
    ])
    perform(before, diffs)
    assertListEqual(after, before)
  })

  it('Miscellaneous actions', function () {
    var before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    var after = ['h', 'i', 'a', 'c', 'd', 'u', 'e', 'f', 'g', 'j', 'b', 'z', 'x', 'y']
    var diffs = diff.diff(before, after, function (item) { return item })
    diffs.children.should.be.deep.equal(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])
    diffs.noChangeChildren.should.be.deep.equal([
      ['a', 'a'],
      ['c', 'c'],
      ['d', 'd'],
      ['e', 'e'],
      ['f', 'f'],
      ['g', 'g'],
    ])
    perform(before, diffs)
    assertListEqual(after, before)
  })

  it('Randomly moving', function () {
    var alphabet = 'klmnopqrstuvwxyz'
    for (var i = 0; i < 20; i++) {
      var before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
      var after = before.slice(0)
      var pos, character

      // move
      var j = 0
      var len = +(Math.random() * 4)
      for (j = 0; j < len; j++) {
        // random removing item
        pos = random(after.length)
        character = after[pos]
        after.splice(pos, 1)

        // random insert item
        pos = random(after.length)
        after.splice(pos, 0, character)
      }

      // remove
      j = 0
      len = +(Math.random() * 4)
      for (j = 0; j < len; j++) {
        pos = random(after.length)
        after.splice(pos, 1)
      }

      // insert
      j = 0
      len = +(Math.random() * 10)
      for (j = 0; j < len; j++) {
        pos = random(after.length)
        var newItemPos = random(alphabet.length)
        character = alphabet[newItemPos]
        after.splice(pos, 0, character)
      }

      var diffs = diff.diff(before, after, function (item) { return item })
      perform(before, diffs)
      assertListEqual(after, before)
    }
  })

  it('Test example', function () {
    var diff = require('../index')
    var oldList = [{id: 'a'}, {id: 'b'}, {id: 'c'}, {id: 'd'}, {id: 'e'}]
    var newList = [{id: 'c'}, {id: 'a'}, {id: 'b'}, {id: 'e'}, {id: 'f'}]

    var moves = diff(oldList, newList, 'id').moves
    moves.forEach(function (move) {
      if (move.type === 0) {
        oldList.splice(move.index, 1)
      } else {
        oldList.splice(move.index, 0, move.item)
      }
    })
    assertListEqual(newList, oldList)
  })
})
