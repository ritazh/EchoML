/*
 * This script is provided to give an example how the playlist can be controlled using the event emitter.
 * This enables projects to create/control the useability of the project.
*/
let ee;
let $container;
let $timeFormat;
let $audioStart;
let $audioEnd;
let $time;
let format = 'hh:mm:ss.uuu';
let startTime = 0;
let endTime = 0;
let audioPos = 0;
let downloadUrl;
let isLooping = false;
let playoutPromises;

export function loadEmitter(playlist) {
  ee = playlist.getEventEmitter();
  $container = $('body');
  $timeFormat = $container.find('.time-format');
  $audioStart = $container.find('.audio-start');
  $audioEnd = $container.find('.audio-end');
  $time = $container.find('.audio-pos');
  updateSelect(startTime, endTime);
  updateTime(audioPos);

  $container.on('click', '.btn-annotations-download', () => {
    ee.emit('annotationsrequest');
  });

  $container.on('click', '.btn-loop', () => {
    isLooping = true;
    playoutPromises = playlist.play(startTime, endTime);
  });

  $container.on('click', '.btn-play', () => {
    ee.emit('play');
  });

  $container.on('click', '.btn-pause', () => {
    isLooping = false;
    ee.emit('pause');
  });

  $container.on('click', '.btn-stop', () => {
    isLooping = false;
    ee.emit('stop');
  });

  $container.on('click', '.btn-rewind', () => {
    isLooping = false;
    ee.emit('rewind');
  });

  $container.on('click', '.btn-fast-forward', () => {
    isLooping = false;
    ee.emit('fastforward');
  });

  $container.on('click', '.btn-clear', () => {
    isLooping = false;
    ee.emit('clear');
  });

  $container.on('click', '.btn-record', () => {
    ee.emit('record');
  });

  // track interaction states
  $container.on('click', '.btn-cursor', function () {
    ee.emit('statechange', 'cursor');
    toggleActive(this);
  });

  $container.on('click', '.btn-select', function () {
    ee.emit('statechange', 'select');
    toggleActive(this);
  });

  $container.on('click', '.btn-shift', function () {
    ee.emit('statechange', 'shift');
    toggleActive(this);
  });

  $container.on('click', '.btn-fadein', function () {
    ee.emit('statechange', 'fadein');
    toggleActive(this);
  });

  $container.on('click', '.btn-fadeout', function () {
    ee.emit('statechange', 'fadeout');
    toggleActive(this);
  });

  // fade types
  $container.on('click', '.btn-logarithmic', function () {
    ee.emit('fadetype', 'logarithmic');
    toggleActive(this);
  });

  $container.on('click', '.btn-linear', function () {
    ee.emit('fadetype', 'linear');
    toggleActive(this);
  });

  $container.on('click', '.btn-scurve', function () {
    ee.emit('fadetype', 'sCurve');
    toggleActive(this);
  });

  $container.on('click', '.btn-exponential', function () {
    ee.emit('fadetype', 'exponential');
    toggleActive(this);
  });

  // zoom buttons
  $container.on('click', '.btn-zoom-in', () => {
    ee.emit('zoomin');
  });

  $container.on('click', '.btn-zoom-out', () => {
    ee.emit('zoomout');
  });

  $container.on('click', '.btn-trim-audio', () => {
    ee.emit('trim');
  });

  $container.on('click', '.btn-info', () => {
    console.log(playlist.getInfo());
  });

  $container.on('click', '.btn-download', () => {
    ee.emit('startaudiorendering', 'flac');
  });

  $container.on('click', '.btn-seektotime', () => {
    const time = parseInt(document.getElementById('seektime').value, 10);
    ee.emit('select', time, time);
  });

  $container.on('change', '.select-seek-style', (node) => {
    playlist.setSeekStyle(node.target.value);
  });

  // track drop
  $container.on('dragenter', '.track-drop', (e) => {
    e.preventDefault();
    e.target.classList.add('drag-enter');
  });

  $container.on('dragover', '.track-drop', (e) => {
    e.preventDefault();
  });

  $container.on('dragleave', '.track-drop', (e) => {
    e.preventDefault();
    e.target.classList.remove('drag-enter');
  });

  $container.on('drop', '.track-drop', (e) => {
    e.preventDefault();
    e.target.classList.remove('drag-enter');

    const dropEvent = e.originalEvent;

    for (let i = 0; i < dropEvent.dataTransfer.files.length; i++) {
      ee.emit('newtrack', dropEvent.dataTransfer.files[i]);
    }
  });

  $container.on('change', '.time-format', (e) => {
    format = $timeFormat.val();
    ee.emit('durationformat', format);

    updateSelect(startTime, endTime);
    updateTime(audioPos);
  });

  $container.on('input change', '.master-gain', (e) => {
    ee.emit('mastervolumechange', e.target.value);
  });

  $container.on('change', '.continuous-play', (e) => {
    ee.emit('continuousplay', $(e.target).is(':checked'));
  });

  $container.on('change', '.link-endpoints', (e) => {
    ee.emit('linkendpoints', $(e.target).is(':checked'));
  });

  $container.on('change', '.automatic-scroll', (e) => {
    ee.emit('automaticscroll', $(e.target).is(':checked'));
  });

    /*
  * Code below receives updates from the playlist.
  */
  ee.on('select', updateSelect);

  ee.on('timeupdate', updateTime);

  ee.on('mute', (track) => {
    displaySoundStatus(`Mute button pressed for ${track.name}`);
  });

  ee.on('solo', (track) => {
    displaySoundStatus(`Solo button pressed for ${track.name}`);
  });

  ee.on('volumechange', (volume, track) => {
    displaySoundStatus(`${track.name} now has volume ${volume}.`);
  });

  ee.on('mastervolumechange', (volume) => {
    displaySoundStatus(`Master volume now has volume ${volume}.`);
  });


  const audioStates = ['uninitialized', 'loading', 'decoding', 'finished'];

  ee.on('audiorequeststatechange', (state, src) => {
    let name = src;

    if (src instanceof File) {
      name = src.name;
    }

    displayLoadingData(`Track ${name} is in state ${audioStates[state]}`);
  });

  ee.on('loadprogress', (percent, src) => {
    let name = src;

    if (src instanceof File) {
      name = src.name;
    }

    displayLoadingData(`Track ${name} has loaded ${percent}%`);
  });

  ee.on('audiosourcesloaded', () => {
    displayLoadingData('Tracks have all finished decoding.');
  });

  ee.on('audiosourcesrendered', () => {
    displayLoadingData('Tracks have been rendered');
  });

  ee.on('audiorenderingfinished', (type, data) => {
    const URL = window.URL || window.webkitURL;
    if (type == 'wav' || type == 'flac') {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      downloadUrl = URL.createObjectURL(data);
      displayDownloadLink(downloadUrl);
    }
  });

  ee.on('finished', () => {
    console.log('The cursor has reached the end of the selection !');

    if (isLooping) {
      playoutPromises.then(() => {
        playoutPromises = playlist.play(startTime, endTime);
      });
    }
  });
}


function toggleActive(node) {
  const active = node.parentNode.querySelectorAll('.active');
  let i = 0,
    len = active.length;

  for (; i < len; i++) {
    active[i].classList.remove('active');
  }

  node.classList.toggle('active');
}

function cueFormatters(format) {
  function clockFormat(seconds, decimals) {
    let hours,
      minutes,
      secs,
      result;

    hours = parseInt(seconds / 3600, 10) % 24;
    minutes = parseInt(seconds / 60, 10) % 60;
    secs = seconds % 60;
    secs = secs.toFixed(decimals);

    result = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${secs < 10 ? `0${secs}` : secs}`;

    return result;
  }

  const formats = {
    seconds(seconds) {
      return seconds.toFixed(0);
    },
    thousandths(seconds) {
      return seconds.toFixed(3);
    },
    'hh:mm:ss': function (seconds) {
      return clockFormat(seconds, 0);
    },
    'hh:mm:ss.u': function (seconds) {
      return clockFormat(seconds, 1);
    },
    'hh:mm:ss.uu': function (seconds) {
      return clockFormat(seconds, 2);
    },
    'hh:mm:ss.uuu': function (seconds) {
      return clockFormat(seconds, 3);
    },
  };

  return formats[format];
}

function updateSelect(start, end) {
  if (start < end) {
    $('.btn-trim-audio').removeClass('disabled');
    $('.btn-loop').removeClass('disabled');
  } else {
    $('.btn-trim-audio').addClass('disabled');
    $('.btn-loop').addClass('disabled');
  }

  $audioStart.val(cueFormatters(format)(start));
  $audioEnd.val(cueFormatters(format)(end));

  startTime = start;
  endTime = end;
}

function updateTime(time) {
  $time.html(cueFormatters(format)(time));

  audioPos = time;
}

// updateSelect(startTime, endTime);
// updateTime(audioPos);


/*
* Code below sets up events to send messages to the playlist.
*/
// $container.on("click", ".btn-playlist-state-group", function() {
//   //reset these for now.
//   $('.btn-fade-state-group').addClass('hidden');
//   $('.btn-select-state-group').addClass('hidden');

//   if ($('.btn-select').hasClass('active')) {
//     $('.btn-select-state-group').removeClass('hidden');
//   }

//   if ($('.btn-fadein').hasClass('active') || $('.btn-fadeout').hasClass('active')) {
//     $('.btn-fade-state-group').removeClass('hidden');
//   }
// });


function displaySoundStatus(status) {
  $('.sound-status').html(status);
}

function displayLoadingData(data) {
  const info = $('<div/>').append(data);
  $('.loading-data').append(info);
}

function displayDownloadLink(link) {
  const dateString = (new Date()).toISOString();
  const $link = $('<a/>', {
    href: link,
    download: `waveformplaylist${dateString}.wav`,
    text: `Download mix ${dateString}`,
    class: 'btn btn-small btn-download-link',
  });

  $('.btn-download-link').remove();
  $('.btn-download').after($link);
}

