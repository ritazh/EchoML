

var notes = [
  {
   "begin": "0.000", 
   "children": [], 
   "end": "3.680", 
   "id": "f000001", 
   "language": "eng", 
   "lines": [
    "1"
   ]
  }, 
  {
   "begin": "3.680", 
   "children": [], 
   "end": "10.880", 
   "id": "f000002", 
   "language": "eng", 
   "lines": [
    "bird one"
   ]
  }, 
  {
   "begin": "10.880", 
   "children": [], 
   "end": "29.240", 
   "id": "f000003", 
   "language": "eng", 
   "lines": [
    "bird two"
   ]
  }
];

var actions = [
  {
    class: 'fa.fa-minus',
    title: 'Reduce annotation end by 0.010s',
    action: (annotation, i, annotations, opts) => {
      var next;
      var delta = 0.010;
      annotation.end -= delta;

      if (opts.linkEndpoints) {
        next = annotations[i + 1];
        next && (next.start -= delta);
      }
    }
  },
  {
    class: 'fa.fa-plus',
    title: 'Increase annotation end by 0.010s',
    action: (annotation, i, annotations, opts) => {
      var next;
      var delta = 0.010;
      annotation.end += delta;

      if (opts.linkEndpoints) {
        next = annotations[i + 1];
        next && (next.start += delta);
      }
    }
  },
  {
    class: 'fa.fa-scissors',
    title: 'Split annotation in half',
    action: (annotation, i, annotations) => {
      const halfDuration = (annotation.end - annotation.start) / 2;

      annotations.splice(i + 1, 0, {
        id: 'test',
        start: annotation.end - halfDuration,
        end: annotation.end,
        lines: ['----'],
        lang: 'en',
      });

      annotation.end = annotation.start + halfDuration;
    }
  },
  {
    class: 'fa.fa-trash',
    title: 'Delete annotation',
    action: (annotation, i, annotations) => {
      annotations.splice(i, 1);
    }
  }
];

function loadAnnotation(){
  console.log('loadAnnotation()')
  var playlist = WaveformPlaylist.init({
    container: document.getElementById("playlist"),
    timescale: true,
    state: 'select',
    samplesPerPixel: 1024,
    colors: {
      waveOutlineColor: '#E0EFF1',
      timeColor: 'grey',
      fadeColor: 'black'
    },
    annotationList: {
      annotations: notes,
      controls: actions,
      editable: true,
      isContinuousPlay: false,
      linkEndpoints: true
    }
  });
  return playlist;
}

function playFile(playlist, url){

  playlist.load([
    {
      src: url
    }
  ]).then(function() {
    //can do stuff with the playlist.
  });
}

