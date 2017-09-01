const WaveformPlaylist = require('waveform-playlist');

// const notes = [
//   {
//     begin: '0.000',
//     children: [],
//     end: '3.680',
//     id: 'f000001',
//     language: 'eng',
//     lines: [
//       '1',
//     ],
//   },
//   {
//     begin: '3.680',
//     children: [],
//     end: '10.880',
//     id: 'f000002',
//     language: 'eng',
//     lines: [
//       'bird one',
//     ],
//   },
//   {
//     begin: '10.880',
//     children: [],
//     end: '29.240',
//     id: 'f000003',
//     language: 'eng',
//     lines: [
//       'bird two',
//     ],
//   },
// ];

const actions = [
  {
    class: 'fa.fa-minus',
    title: 'Reduce annotation end by 0.010s',
    action: (annotation, i, annotations, opts) => {
      let next;
      const delta = 0.010;
      annotation.end -= delta;

      if (opts.linkEndpoints) {
        next = annotations[i + 1];
        next && (next.start -= delta);
      }
    },
  },
  {
    class: 'fa.fa-plus',
    title: 'Increase annotation end by 0.010s',
    action: (annotation, i, annotations, opts) => {
      let next;
      const delta = 0.010;
      annotation.end += delta;

      if (opts.linkEndpoints) {
        next = annotations[i + 1];
        next && (next.start += delta);
      }
    },
  },
  {
    class: 'fa.fa-scissors',
    title: 'Split annotation in half',
    action: (annotation, i, annotations) => {
      const halfDuration = (annotation.end - annotation.start) / 2;

      annotations.splice(i + 1, 0, {
        id: 'New',
        start: annotation.end - halfDuration,
        end: annotation.end,
        lines: ['----'],
        lang: 'en',
      });

      annotation.end = annotation.start + halfDuration;
    },
  },
  {
    class: 'fa.fa-trash',
    title: 'Delete annotation',
    action: (annotation, i, annotations) => {
      annotations.splice(i, 1);
    },
  },
];

export function loadLabels(data) {
  data.sort((a, b) => ((a.start < b.start) ? -1 : 1));

  const notes = [];
  if (data.length > 0) {
    let lastBegin = -1;
    let lastEnd = -1;
    let repeatIndex = -1;
    const setIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (lastBegin == data[i].begin && lastEnd == data[i].end) {
        const last = notes.splice(-1, 1)[0];
        const text = last.lines[0];
        notes.push({
          begin: data[i].begin,
          end: data[i].end,
          id: `${repeatIndex}`,
          language: 'eng',
          lines: [
            `${text}; ${data[i].label}`,
          ],
        });
      } else {
        repeatIndex = i;
        notes.push({
          begin: data[i].begin,
          end: data[i].end,
          id: `${repeatIndex}`,
          language: 'eng',
          lines: [
            data[i].label,
          ],
        });
      }

      lastBegin = data[i].begin;
      lastEnd = data[i].end;
    }
  } else {
    notes.push({
      begin: '0.000',
      end: '5.000',
      id: 'New',
      language: 'eng',
      lines: ['----'],
    });
  }

  return notes;
}

export function loadAnnotation(notes) {
  const playlist = WaveformPlaylist.init({
    container: document.getElementById('playlist'),
    timescale: true,
    state: 'select',
    samplesPerPixel: 3400,
    zoomLevels: [1000, 2000, 3400, 4000],
    colors: {
      waveOutlineColor: '#E0EFF1',
      timeColor: 'grey',
      fadeColor: 'black',
    },
    annotationList: {
      annotations: notes,
      controls: actions,
      editable: true,
      isContinuousPlay: false,
      linkEndpoints: true,
    },
  });
  return playlist;
}

export function playFile(playlist, url, spectrogramurl) {
  playlist.load([
    {
      src: url,
      spectrogramsrc: spectrogramurl,
    },
  ]).then(() => {
    // can do stuff with the playlist.
    // initialize the WAV exporter.
    playlist.initExporter();
  });
}

