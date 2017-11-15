#!/usr/bin/env node

// You need "npm install pdf-text-extract" first.
// TODO: reduce false positives (such as page header and footer)

var previousVersion = 'bookdraft2017june19.pdf'
var newVersion = 'bookdraft2017nov5.pdf'
var previousOutput = 'old-text.txt'
var newOutput = 'new-text.txt'

var fs = require('fs')
var extract = require('pdf-text-extract')

var newPageMarker = 'N'
var stringMarker = 'S'
var hyphenMarker = 'H'
var rangeMarker = 'R'

var oldWords = []
var newWords = []

extract(previousVersion, {splitPages: false}, function (err, pages) {
  if (err) {
    console.dir(err)
    return
  }
  var output = fs.openSync(previousOutput, 'w')
  fs.closeSync(output)
  for (page in pages) {
    fs.appendFileSync(previousOutput,
              pages[page].trim().replace(/\n/g, ' ').replace(/ +/g, ' ') + '\n')
    oldWords = oldWords.concat(newPageMarker,
                             pages[page].trim().split(/\s+/).reduce(folder, []))
  }

  extract(newVersion, {splitPages: false}, function (err, pages) {
    if (err) {
      console.dir(err)
      return
    }
    var output = fs.openSync(newOutput, 'w')
    fs.closeSync(output)
    for (page in pages) {
      fs.appendFileSync(newOutput,
              pages[page].trim().replace(/\n/g, ' ').replace(/ +/g, ' ') + '\n')
      newWords = newWords.concat(newPageMarker,
                             pages[page].trim().split(/\s+/).reduce(folder, []))
    }

    print_diff()
  })
})

function folder(acc, elm) {
  if (elm == '.') return acc
  var last_elm = acc[acc.length - 1]
  if (last_elm && last_elm.charAt(last_elm.length - 1) == '-') {
    acc[acc.length - 1] = hyphenMarker + last_elm.substr(1) + elm
    return acc
  }
  if (last_elm && last_elm.charAt(last_elm.length - 1) == '–') {
    acc[acc.length - 1] = rangeMarker + last_elm.substr(1) + elm
    return acc
  }
  return acc.concat([stringMarker + elm])
}

function print_diff() {
  var oldIdx = 0, newIdx = 0

  while (oldIdx < oldWords.length && newIdx < newWords.length) {
    if (equal(oldWords[oldIdx], newWords[newIdx])) {
      oldIdx++
      newIdx++
    } else {
      var skipIdxes = sync(oldIdx, newIdx)
      if (!skipIdxes.ignore) {
        print_skip(skipIdxes)
      }
      oldIdx = skipIdxes.oldEnd
      newIdx = skipIdxes.newEnd
    }
  }
}

function equal(a, b) {
  if (!a || !b) return false
  if (a.charAt(0) == hyphenMarker || b.charAt(0) == hyphenMarker) {
    if (a.substr(1).split('-').join('') == b.substr(1).split('-').join(''))
      return true
  } else if (a.charAt(0) == rangeMarker || b.charAt(0) == rangeMarker) {
    if (a.substr(1).split('–').join('') == b.substr(1).split('–').join(''))
      return true
  } else if (a.charAt(0) == stringMarker) {
    if (a == b) return true
  }
  return false
}

var termsToSync = 10
var termsToIgnore = 10

function sync(oldIdx, newIdx) {
  it = gen_pair(oldIdx, newIdx)
  while (true) {
    var idx = it.next().value
    if (!idx) break
    o = idx[0]
    n = idx[1]

    var success = true
    for (var i = 0; i < termsToSync; i++) {
      if (!equal(oldWords[o + i], newWords[n + i])) {
        success = false
        break
      }
    }
    if (success) {
      var ret = {oldStart: oldIdx, oldEnd: o, newStart: newIdx, newEnd: n,
                 ignore: false}
   
      if (oldWords[oldIdx] == newPageMarker
          && o - oldIdx < termsToIgnore
          && n == newIdx) {
        ret.ignore = true
      } else if (newWords[newIdx] == newPageMarker
          && o == oldIdx
          && n - newIdx < termsToIgnore) {
        ret.ignore = true
      }
      return ret;
    }
  }
  return {oldStart: oldIdx, oldEnd: oldWords.length,
          newStart: newIdx, newEnd: newWords.length, ignore: false}
}

function* gen_pair(oldIdx, newIdx) {
  var oldLimit = oldWords.length
  var newLimit = newWords.length
  var limit = (oldLimit - oldIdx) + (newLimit - newIdx) - 1
  for (var i = 1; i < limit; i++) {
    for (var j = 0; j <= i; j++) {
      if (j + oldIdx < oldLimit && i - j + newIdx < newLimit) {
        yield [j + oldIdx, i - j + newIdx]
      }
    }
  }
}

var contextTerms = 5

function print_skip(idxes) {
  console.log(`# ${idxes.oldStart}-${idxes.oldEnd} ${idxes.newStart}-${idxes.newEnd}`)
  console.log('<< ', oldWords.slice(idxes.oldStart - contextTerms,
                              idxes.oldEnd + contextTerms).map(print).join(' '))
  console.log('>> ', newWords.slice(idxes.newStart - contextTerms,
                              idxes.newEnd + contextTerms).map(print).join(' '))
  console.log()
}

function print(s) {
  if (!s) return '[null]'
  if (s.charAt(0) == stringMarker) return s.substr(1)
  if (s.charAt(0) == hyphenMarker) return s.substr(1).replace(/-/g, '/-')
  if (s.charAt(0) == rangeMarker) return s.substr(1).replace(/–/g, '/–')
  return ''
}

