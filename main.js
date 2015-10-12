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

function midiMessageReceived(event) {
  midiMessages.push(event)
}

midiMessages
  .map(function(e) { return e.data })
  .log()
