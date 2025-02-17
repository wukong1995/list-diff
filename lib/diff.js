/**
 * Diff two list in O(N).
 * @param {Array} oldList - Original List
 * @param {Array} newList - List After certain insertions, removes, or moves
 * @return {Object} - {moves: <Array>}
 *                  - moves is a list of actions that telling how to remove and insert
 */
function diff (oldList, newList, key) {
  var oldKeyIndex = makeKey2Index(oldList, key)
  var newKeyIndex = makeKey2Index(newList, key)
  var moves = []
  const noChangeChildren = []

  // a simulate list to manipulate
  var children = []
  var i = 0
  var item
  var itemKey

  // first pass to check item in old list: if it's removed or not
  while (i < oldList.length) {
    item = oldList[i]
    itemKey = getItemKey(item, key)

  if (!newKeyIndex.hasOwnProperty(itemKey)) {
      children.push(null)
    } else {
      children.push(item)
    }

    i++
  }

  var simulateList = children.slice(0)

  // remove items no longer exist
  i = 0
  let deleteCount = 0
  while (i < simulateList.length) {
    if (simulateList[i] === null) {
      remove(i, oldList[i + deleteCount])
      removeSimulate(i)
      deleteCount++;
    } else {
      i++
    }
  }

  // i is cursor pointing to a item in new list
  // j is cursor pointing to a item in simulateList
  var j = i = 0
  while (i < newList.length) {
    item = newList[i]
    itemKey = getItemKey(item, key)

    var simulateItem = simulateList[j]
    var simulateItemKey = getItemKey(simulateItem, key)

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        noChangeChildren.push([simulateItem, item])
        j++
      } else {
        // new item, just inesrt it
        if (!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i, item)
        } else {
          // if remove current simulateItem make item in right place
          // then just remove it
          var nextItemKey = getItemKey(simulateList[j + 1], key)
          if (nextItemKey === itemKey) {
            noChangeChildren.push([simulateList[j + 1], item])
            remove(i, simulateItem)
            removeSimulate(j)
            j++ // after removing, current j is right, just jump to next one
          } else {
            // else insert item
            insert(i, item)
          }
        }
      }
    } else {
      insert(i, item)
    }

    i++
  }

  //if j is not remove to the end, remove all the rest item
  var k = simulateList.length - j
  var r = 0
  while (j++ < simulateList.length) {
    k--
    r++
    remove(k + i, simulateList[simulateList.length - r])
  }


  function remove (index, item) {
    var move = {index: index, type: 'remove', item}
    moves.push(move)
  }

  function insert (index, item) {
    var move = {index: index, item: item, type: 'add'}
    moves.push(move)
  }

  function removeSimulate (index) {
    simulateList.splice(index, 1)
  }

  return {
    moves: moves,
    children: children,
    noChangeChildren,
  }
}

/**
 * Convert list to key-item keyIndex object.
 * @param {Array} list
 * @param {String|Function} key
 */
function makeKey2Index (list, key) {
  var keyIndex = {}
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i]
    var itemKey = getItemKey(item, key)
    keyIndex[itemKey] = i
  }
  return keyIndex
}

function getItemKey (item, key) {
  if (!item || !key) return void 666
  return typeof key === 'string'
    ? item[key]
    : key(item)
}

exports.makeKey2Index = makeKey2Index // exports for test
exports.diff = diff
