var _ = require('lodash')
var $ = require('jquery')
var Bacon = require('baconjs')
var bjq = require("bacon-jquery-bindings")

var inputs = $('#inputs')

var midiMessages = new Bacon.Bus()

navigator.requestMIDIAccess()
  .then(function(midiAccess) {
    inputs.empty()
    midiAccess.inputs.forEach(function(input) {
      inputs.append('<li data-id="' + input.id + '">'
        + '<a href="#">' + input.name + '</a>'
        + '</li>')
    })
  })

var midiInputSelects = $("#inputs")
  .asEventStream("click")
  .doAction(".preventDefault")
  .map(function(event) { return $(event.target) })
  .filter(function(target) { return target.is('a') })

midiInputSelects.onValue(function(a) {
  inputs.find('li').removeClass('selected')
  var selectedLi = a.parent()
  selectedLi.addClass('selected')
  openMidiInputPort(selectedLi.data('id'))
})

function openMidiInputPort(id) {
  navigator.requestMIDIAccess()
    .then(function(midiAccess) {
      midiAccess.inputs.forEach(function(input) {
        if (input.id === id) {
          input.open()
          input.onmidimessage = midiMessageReceived
        }
      })
    })
}

var midiData = midiMessages
  .map(function(e) { return e.data })
  .filter(filterMidiChannel(0))

var notesPressed = midiData
  .scan([], function(previous, data) {
    if (isNoteOn(data)) {
      return _.union(previous, [data[1]])
    } else if (isNoteOff(data)) {
      return _.without(previous, data[1])
    } else {
      return previous
    }
  }).toProperty()

notesPressed
  .sample(200)
  .scan({}, function(previous, notes) {
    if (notes.length === 0) return {}

    var index = nextIndex(previous.index)
    return {
      index: index,
      note: notes[index]
    }
  })
  .map('.note')
  .filter(function(x) { return x })
  .log()

function nextIndex(index) {
  return (index === undefined) ? 0 : (index + 1) % notes.length
}

function midiMessageReceived(event) {
  midiMessages.push(event)
}

function filterMidiChannel(channel) {
  return function (data) {
    return (data[0] & 0x0f) === channel
  }
}

function isNoteOn(data) {
  return (data[0] & 0xf0) === 0x90
}

function isNoteOff(data) {
  return (data[0] & 0xf0) === 0x80
}
