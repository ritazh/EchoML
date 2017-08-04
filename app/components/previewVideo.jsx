// // @flow
// import { connect } from 'react-redux';
// import React from 'react';
// import { locToUrl, calcDisplaySize } from '../common/util';
// import { loadAnnotation, loadLabels, playFile } from '../annotations';
// import { loadEmitter } from '../emitter';
// import * as actions from '../actions';
// import Alert from './alert';

// class PreviewVideo extends React.Component {
//   playlist = null;
//   static propTypes = {
//     dispatch: React.PropTypes.func,
//     loc: React.PropTypes.object,
//     preview: React.PropTypes.object,
//     containers: React.PropTypes.array,
//   };

//   saveLabels() {
//     const fullpath = locToUrl(this.props.loc);
//     const index = fullpath.lastIndexOf('/');
//     const storageAccount = this.props.containers[fullpath.substring(index + 1)].storageAccount;
//     const containerName = this.props.containers[fullpath.substring(index + 1)].name;
//     console.log(this.playlist.annotationList.annotations);
//     this.props.dispatch(
//       actions.saveLabels(
//         storageAccount,
//         containerName,
//         this.props.preview.filename,
//         this.playlist.annotationList.annotations,
//       ),
//     );
//   }

//   componentDidMount() {
//     const labels = loadLabels(this.props.preview.labels);
//     this.playlist = loadAnnotation(labels);

//     loadEmitter(this.playlist);
//     const fullpath = locToUrl(this.props.loc);
//     const index = fullpath.lastIndexOf('/');
//     const storageAccount = this.props.containers[fullpath.substring(index + 1)].storageAccount;
//     const containerName = this.props.containers[fullpath.substring(index + 1)].name;

//     const filePromise = this.props.dispatch(
//       actions.downloadFile(storageAccount, containerName, this.props.preview.filename),
//     );
//     const spectrogramPromise = this.props.dispatch(
//       actions.downloadFile(
//         storageAccount,
//         containerName,
//         this.props.preview.filename.replace('.flac', '.png'),
//       ),
//     );

//     // Download files and begin playing
//     Promise.all([filePromise, spectrogramPromise])
//       .then((values) => {
//         const localFileUrl = values[0];
//         const localSpectroUrl = values[1];
//         playFile(this.playlist, localFileUrl, localSpectroUrl);
//       })
//       .catch((reason) => {
//         console.error(reason);
//       });
//   }

//   componentWillUnmount() {
//     // fixes issue with 'AudioContext': number of hardware contexts reached maximum
//     this.playlist.ac.close();
//   }

//   render() {
//     const preImgStyle = {
//       position: 'absolute',
//       width: '100%',
//       textAlign: 'center',
//       color: '#ccc',
//     };
//     const preStyle = {
//       position: 'relative',
//       display: 'block',
//       overflow: 'hidden',
//     };
//     const playlistStyle = {
//       background: '#fff',
//     };
//     const captionStyle = {
//       position: 'absolute',
//       bottom: '2em',
//       width: '100%',
//       textAlign: 'center',
//     };
//     const imageStyle = {
//       position: 'relative',
//       display: 'block',
//       left: '400px',
//       top: '40px',
//     };

//     const outWidth = window.document.documentElement.clientWidth;
//     const outHeight = window.document.documentElement.clientHeight;
//     const displaySize = calcDisplaySize(outWidth, outHeight, outWidth, outHeight);
//     preStyle.width = `${displaySize.width}px`;
//     preStyle.height = `${displaySize.height}px`;
//     preStyle.left = `${(outWidth - displaySize.width) / 2}px`;
//     preStyle.top = `${(outHeight - displaySize.height) / 2}px`;

//     playlistStyle.height = `${displaySize.height / 2}px`;

//     const preImgStyleY = (outHeight - displaySize.height) / 2;
//     preImgStyle.top = `${preImgStyleY}px`;

//     return (
//       <div>
//         <div style={preStyle}>
//           <Alert />
//           <div id="top-bar" className="playlist-top-bar">
//             <div className="playlist-toolbar">
//               <div className="btn-group">
//                 <span className="btn-pause btn btn-warning">
//                   <i className="fa fa-pause" />
//                 </span>
//                 <span className="btn-play btn btn-success">
//                   <i className="fa fa-play" />
//                 </span>
//                 <span className="btn-stop btn btn-danger">
//                   <i className="fa fa-stop" />
//                 </span>
//                 <span className="btn-rewind btn btn-success">
//                   <i className="fa fa-fast-backward" />
//                 </span>
//                 <span className="btn-fast-forward btn btn-success">
//                   <i className="fa fa-fast-forward" />
//                 </span>
//               </div>
//               <div className="btn-group btn-playlist-state-group">
//                 <span className="btn-cursor btn btn-default active" title="select cursor">
//                   <i className="fa fa-headphones" />
//                 </span>
//                 <span className="btn-select btn btn-default" title="select audio region">
//                   <i className="fa fa-italic" />
//                 </span>
//               </div>
//               <div className="btn-group" onClick={() => this.saveLabels()}>
//                 <span
//                   title="Save the labels as json"
//                   className="btn-annotations-download btn btn-success"
//                 >
//                   Save Labels
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div id="playlist" style={playlistStyle} />
//         </div>

//         <div style={captionStyle}>
//           {this.props.preview.filename}
//         </div>
//       </div>
//     );
//   }
// }

// const mapStateToProps = state => ({
//   loc: state.loc,
//   preview: state.preview,
//   containers: state.containers,
// });

// export default connect(mapStateToProps)(PreviewVideo);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { connect } from 'react-redux';
import React from 'react';
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline';
import moment from 'moment';
import * as actions from '../actions';
import { locToUrl, calcDisplaySize } from '../common/util';

/**
 * AudioPlayer
 * This class is an implementation and feature extension of wavesurfer.js
 * Regions are maintained in the single wavesurfer instance and metadata such as labels is
 * maintained in regionId->Object map in region map in state
 */
class PreviewVideo extends React.Component {
  constructor(props) {
    super(props);
    const regions = this.props.preview.labels.reduce((carry, label) => {
      // give random id
      carry[Math.random().toString(36).substring(7)] = label;
      return carry;
    }, {});
    // const regions = this.props.preview.labels;
    this.state = {
      regions, // key = region id; value = object of metadata
      wavesurfer: null,
      wavesurferReady: false,
      audioSrc: null,
      // audioSrc: "11. Aerith's Theme.flac",
      spectrogramEnabled: false,
      zoom: 0,
      wavesurferShouldScroll: false,
      regionsBeingPlayed: [],
      ...this.props,
    };
    this.spectrogramHeight = 512; // containing div will be 256, spectrogram canvas 128
  }

  componentDidMount() {
    const fullpath = locToUrl(this.props.loc);
    const index = fullpath.lastIndexOf('/');
    const storageAccount = this.props.containers[fullpath.substring(index + 1)].storageAccount;
    const containerName = this.props.containers[fullpath.substring(index + 1)].name;
    const filePromise = this.props
      .dispatch(actions.downloadFile(storageAccount, containerName, this.props.preview.filename))
      .then((localStorageUrl) => {
        this.setState(
          {
            audioSrc: localStorageUrl,
          },
          () => {
            this.initWavesurfer().then((wavesurfer) => {
              window.wavesurfer = wavesurfer;
            });
          },
        );
      });
  }

  componentWillUnmount() {
    this.destroyWavesurfer();
  }

  destroyWavesurfer = () =>
    new Promise((resolve) => {
      this.state.wavesurfer.destroy();
      this.setState({ wavesurfer: null }, () => {
        resolve();
      });
    });

  initWavesurfer = (options = {}) =>
    new Promise((resolve) => {
      const wavesurfer = WaveSurfer.create({
        container: this.wavesurfer,
        waveColor: 'violet',
        progressColor: 'purple',
        scrollParent: false,
        hideScrollbar: false,
        plugins: [
          SpectrogramPlugin.create({
            container: this.wavesurferSpectrogram,
            fftSamples: this.spectrogramHeight,
            labels: true,
          }),
          TimelinePlugin.create({
            container: this.wavesurferTimeline,
          }),
          MinimapPlugin.create(),
          RegionsPlugin.create(),
        ],
        ...options,
      });
      // wavesurfer.setMute(true);
      wavesurfer.load(this.audio.src);
      wavesurfer.on('loading', (loadingProgress) => {
        this.setState({ loadingProgress });
      });

      /**
       * Add/update the provided region in state
       * @param {WavesurferRegion} region
       */
      const putRegion = (region) => {
        const existingRegion = this.state.regions[region.id];
        const stateRegion = {
          start: region.start,
          end: region.end,
          label: existingRegion ? existingRegion.label : '',
        };
        this.setState({ regions: { ...this.state.regions, [region.id]: stateRegion } });
      };

      wavesurfer.on('region-updated', (region) => {
        putRegion(region);
      });
      wavesurfer.on('region-created', (region) => {
        putRegion(region);
      });
      // wavesurfer.on('region-removed', (region) => {
      //   const regions = { ...this.state.regions };
      //   delete regions[region.id];
      //   this.setState({
      //     regions,
      //   });
      // });
      wavesurfer.on('region-in', (region) => {
        this.setState({
          regionsBeingPlayed: [...this.state.regionsBeingPlayed, region],
        });
      });
      wavesurfer.on('region-out', (region) => {
        const regionsBeingPlayed = [...this.state.regionsBeingPlayed].filter(
          filterRegion => filterRegion.id !== region.id,
        );
        this.setState({ regionsBeingPlayed });
      });

      // Resolve wavesurfer instance
      wavesurfer.on('ready', () => {
        // bind wavesurfer and add label metadata to state
        this.setState({ wavesurfer }, () => {
          // // map existing labels to new wavesurfer regions
          // for (const region of Object.values(this.state.regions)) {
          //   this.addRegion({ ...region });
          // }

          this.syncRegions();
          resolve(wavesurfer);
        });
      });
    });

  toggleScroll = async () => {
    const wavesurferShouldScroll = !this.state.wavesurferShouldScroll;
    await this.destroyWavesurfer();
    const wavesurfer = await this.initWavesurfer({
      scrollParent: wavesurferShouldScroll,
    });
    await new Promise(resolve =>
      this.setState(
        {
          wavesurferShouldScroll,
          wavesurfer,
        },
        () => resolve(),
      ),
    );
    return wavesurfer;
  };

  randomColor = (gradient = 0.5) =>
    `rgba(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(
      Math.random() * 256,
    )}, ${gradient})`;

  /**
   * Sync regions from state to wavesurfer
   * call this whenever a wavesurfer region is modified
   * @return {Promise}
   */
  syncRegions = () => {
    const wavesurverRegions = this.state.wavesurfer.regions.list;
    for (const [id, region] of Object.entries(this.state.regions)) {
      const color = wavesurverRegions[id] ? wavesurverRegions[id].color : this.randomColor();
      const wavesurferRegionOptions = {
        id,
        color,
        ...region,
      };

      // delete if already existing
      if (wavesurverRegions[id]) {
        wavesurverRegions[id].remove();
      }
      this.state.wavesurfer.addRegion(wavesurferRegionOptions);
    }
  };

  /**
   * Update state segment and index and reload regions in player
   */
  updateRegion = (region, paramsToUpdate) => {
    const regionToUpdate = this.state.regions[region.id];
    const regions = {
      ...this.state.regions,
      [region.id]: {
        ...regionToUpdate,
        ...paramsToUpdate,
      },
    };

    this.setState({ regions }, () => this.syncRegions());
  };

  /**
   * Add a new segment at the players current time
   */
  addRegion = (options = {}) => {
    const currentTime = this.state.wavesurfer.getCurrentTime();
    const newRegion = {
      start: currentTime - 1,
      end: currentTime + 1,
      label: '',
    };
    const regions = { ...this.state.regions, [Math.random().toString(36).substring(7)]: newRegion };
    this.setState({ regions }, () => this.syncRegions());
  };

  /**
   * Remove segment at index and refresh local player
   */
  removeRegion = (region) => {
    // region.remove();
    const regions = { ...this.state.regions };
    delete regions[region.id];
    this.setState({ regions }, () => this.syncRegions());
  };

  /**
   * Play the segement referred to by segmentId
   */
  playRegion = (segmentId) => {
    const segment = Object.values(this.state.wavesurfer.regions.list).find(
      potentialMatch => potentialMatch.id === segmentId,
    );
    if (segment) {
      // this.state.wavesurfer.playRegion(segment);
      segment.play();
    } else {
      console.error(new Error(`Unable to find segment with id: ${segmentId}`));
    }
  };

  /**
   * @param {number} pxPerSec
   */
  handleZoom = async (minPxPerSec) => {
    const scrollParent = minPxPerSec > 0;
    await this.destroyWavesurfer();
    const wavesurfer = await this.initWavesurfer({ minPxPerSec, scrollParent });
    const finished = await new Promise(resolve =>
      this.setState({ wavesurfer }, () => resolve(wavesurfer)),
    );

    return finished;
  };

  /**
   * merge and return wavesurfer regions and labels data from component state
   */
  getLabels = () => {
    const labels = Object.values(this.state.wavesurfer.regions.list)
      .map((region) => {
        const start = region.start;
        const end = region.end;
        const otherParams = this.state.regions[region.id] || {};
        return {
          start,
          end,
          ...otherParams,
        };
      })
      .map(region => ({
        start: region.start,
        end: region.end,
        label: region.label || '',
      }));

    return labels;
  };

  /**
   * Download regions by simulating a download event
   */
  downloadLabels = () => {
    const labels = this.getLabels();

    // Blob string to download
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(labels))}`;

    // Create fake download element and click
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'labels.json');
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  saveLabels() {
    const fullpath = locToUrl(this.props.loc);
    const index = fullpath.lastIndexOf('/');
    const storageAccount = this.props.containers[fullpath.substring(index + 1)].storageAccount;
    const containerName = this.props.containers[fullpath.substring(index + 1)].name;
    this.props.dispatch(
      actions.saveLabels(
        storageAccount,
        containerName,
        this.props.preview.filename,
        this.getLabels(),
      ),
    );
  }

  togglePlay = () => {
    if (this.state.wavesurfer.isPlaying()) {
      this.state.wavesurfer.pause();
    } else {
      this.state.wavesurfer.play();
    }
  };

  render() {
    const regionIds = Object.keys(this.state.regions);
    const regions = regionIds
      .reduce((carry, id) => {
        // only include those which are both in state and wavesurfer
        if (this.state.wavesurfer && this.state.wavesurfer.regions.list[id]) {
          carry.push(this.state.wavesurfer.regions.list[id]);
        }
        return carry;
      }, [])
      .sort((a, b) => a.start - b.start)
      .map((region) => {
        const className = this.state.regionsBeingPlayed.includes(region) ? 'info' : '';
        return (
          <tr className={className} key={region.id}>
            <td style={{ verticalAlign: 'baseline' }}>
              <code>
                {moment
                  .utc(moment.duration({ seconds: region.start }).asMilliseconds())
                  .format('HH:mm:ss.SSS')}
              </code>
            </td>
            <td style={{ verticalAlign: 'baseline' }}>
              <code>
                {moment
                  .utc(moment.duration({ seconds: region.end }).asMilliseconds())
                  .format('HH:mm:ss.SSS')}
              </code>
            </td>
            <td style={{ verticalAlign: 'baseline' }}>
              <input
                className="form-control input-sm"
                style={{ width: '100%' }}
                contentEditable
                onChange={(e) => {
                  this.updateRegion(region, { label: e.target.value });
                }}
                value={this.state.regions[region.id].label}
              />
            </td>
            <td style={{ display: 'flex' }}>
              <button
                className="btn btn-sm btn-success"
                onClick={() => this.playRegion(region.id)}
                style={{ flex: 'auto' }}
              >
                Play
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => this.removeRegion(region)}>
                Delete
              </button>
            </td>
          </tr>
        );
      });

    return (
      <div
        className="AudioPlayer"
        style={{
          display: 'flex',
          flexFlow: 'column',
          height: '95vh',
          width: '95vw',
          margin: 'auto',
          top: '2.5vh',
          position: 'relative',
          border: '1px solid black',
        }}
      >
        {this.state.audioSrc
          ? <audio
            controls={false}
            src={this.state.audioSrc}
            ref={(ref) => {
              this.audio = ref;
            }}
          >
              Your browser does not support the <code>audio</code> element.
            </audio>
          : null}
        <div className="player-controls" style={{ flex: '0 1 auto', zIndex: 1 }}>
          <button id="play" className="button" onClick={() => this.togglePlay()}>
            play/pause
          </button>
          <button id="segment" className="button" onClick={() => this.addRegion()}>
            Create Label
          </button>
          <input
            type="number"
            defaultValue={0}
            ref={(ref) => {
              this.zoom = ref;
            }}
            min={0}
            max={25}
          />
          <button className="button" onClick={() => this.handleZoom(this.zoom.value)}>
            Update Zoom
          </button>
        </div>

        <div className="btn-group">
          <button className="btn-play btn btn-success" onClick={() => this.state.wavesurfer.play()}>
            <i className="fa fa-play" />
          </button>
          <button
            className="btn-pause btn btn-warning"
            onClick={() => this.state.wavesurfer.pause()}
          >
            <i className="fa fa-pause" />
          </button>
          <button className="btn-stop btn btn-danger" onClick={() => this.state.wavesurfer.stop()}>
            <i className="fa fa-stop" />
          </button>
          <span className="btn-rewind btn btn-success">
            <i className="fa fa-fast-backward" />
          </span>
          <span className="btn-fast-forward btn btn-success">
            <i className="fa fa-fast-forward" />
          </span>
        </div>
        <div
          className="wavesurfer"
          style={{
            flex: '0 1 auto',
            backgroundColor: 'white',
            zIndex: 0,
            border: '1px solid ghostwhite',
            margin: '0 1em',
          }}
        >
          <div
            style={{
              display: this.state.loadingProgress === 100 ? 'initial' : 'none',
            }}
          >
            <div
              ref={(ref) => {
                this.wavesurfer = ref;
              }}
            />
            <div
              ref={(ref) => {
                this.wavesurferTimeline = ref;
              }}
            />
            <div
              ref={(ref) => {
                this.wavesurferSpectrogram = ref;
              }}
              style={{
                textAlign: 'start',
                padding: '-1em 0 0 0',
                height: `${this.spectrogramHeight / 2}px`,
                zIndex: 0,
              }}
            />
          </div>
        </div>

        <pre>
          {/* {JSON.stringify(this.state)} */}
        </pre>
        <div
          style={{
            flex: '1 1 auto',
            overflowY: 'scroll',
            zIndex: 1,
            margin: '0 1em',
            backgroundColor: 'ghostwhite',
          }}
        >
          <table className="table LabelList" style={{ width: '100%', height: '100%' }}>
            <thead>
              <tr>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Label</th>
                <th style={{ display: 'flex' }}>
                  <button
                    style={{ flex: 'auto' }}
                    className="btn btn-sm btn-primary"
                    onClick={() => this.saveLabels()}
                  >
                    Save Labels
                  </button>

                  <button
                    style={{ flex: 'auto' }}
                    className="btn btn-sm btn-secondary"
                    onClick={() => this.downloadLabels()}
                  >
                    Download Labels
                  </button>
                </th>
              </tr>
            </thead>
            <tbody style={{ background: 'ghostwhite' }}>
              {regions}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
  preview: state.preview,
  containers: state.containers,
});

export default connect(mapStateToProps)(PreviewVideo);
