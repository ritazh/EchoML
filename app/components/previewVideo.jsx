import { connect } from 'react-redux';
import React from 'react';
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline';
import moment from 'moment';
import * as actions from '../actions';
import { locToUrl } from '../common/util';

/**
 * AudioPlayer
 * This class is an implementation and feature extension of wavesurfer.js
 * Regions are maintained in the single wavesurfer instance and metadata such as labels is
 * maintained in regionId->Object map in region map in state
 */
class PreviewVideo extends React.Component {
  /**
   * Generate a random color of gradient
   */
  static randomColor = (gradient = 0.5) =>
    `rgba(${Math.floor(Math.random() * 256)},${Math.floor(
      Math.random() * 256,
    )},${Math.floor(Math.random() * 256)}, ${gradient})`;

  constructor(props) {
    super(props);
    const regions = this.props.preview.labels.reduce((carry, label) => {
      // give random id
      carry[
        Math.random()
          .toString(36)
          .substring(10)
      ] = label;
      return carry;
    }, {});
    // const regions = this.props.preview.labels;
    this.state = {
      regions, // key = region id; value = object of metadata
      wavesurfer: null,
      wavesurferReady: false,
      audioSrc: null,
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
    const storageAccount = this.props.containers[fullpath.substring(index + 1)]
      .storageAccount;
    const containerName = this.props.containers[fullpath.substring(index + 1)]
      .name;
    const filePromise = this.props
      .dispatch(
        actions.downloadFile(
          storageAccount,
          containerName,
          this.props.preview.filename,
        ),
      )
      .then((localStorageUrl) => {
        this.setState(
          {
            audioSrc: localStorageUrl,
          },
          () => {
            this.initWavesurfer();
          },
        );
      });
  }

  componentWillUnmount() {
    this.destroyWavesurfer();
  }

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

  loadPredictions = async () => {
    const fullpath = locToUrl(this.props.loc);
    const index = fullpath.lastIndexOf('/');
    const storageAccount = this.props.containers[fullpath.substring(index + 1)]
      .storageAccount;
    const containerName = this.props.containers[fullpath.substring(index + 1)]
      .name;
    await this.props.dispatch(
      actions.getPredictions(
        storageAccount,
        containerName,
        this.props.preview.filename,
        0,
        this.audio.duration,
      ),
    );
    const predictionLabels = this.props.predictions
      .map(prediction => ({
        ...prediction,
        resize: false,
      }))
      .reduce((carry, label) => {
        // give random id
        carry[
          Math.random()
            .toString(36)
            .substring(10)
        ] = label;
        return carry;
      }, {});

    this.setState(
      {
        regions: { ...this.state.regions, ...predictionLabels },
      },
      () => {
        this.syncRegions();
      },
    );
  };

  /**
   * Sync regions from state and predictions from props to wavesurfer
   * call this whenever a wavesurfer region is modified
   * @return {Promise}
   */
  syncRegions = () => {
    const wavesurverRegions = this.state.wavesurfer.regions.list;

    console.log(this.state.regions);
    // Add/update regions in wavesurfer from state
    Object.entries(this.state.regions).forEach(([id, region]) => {
      const color = wavesurverRegions[id]
        ? wavesurverRegions[id].color
        : PreviewVideo.randomColor();
      const wavesurferRegionOptions = {
        id,
        color,
        resize: false,
        ...region,
      };

      // delete if already existing
      if (wavesurverRegions[id]) {
        wavesurverRegions[id].remove();
      }
      this.state.wavesurfer.addRegion(wavesurferRegionOptions);
    });

    // Delete regions in wavesurfer not in state
    const regionsToRemove = Object.values(wavesurverRegions).filter(
      region => !Object.keys(this.state.regions).includes(region.id),
    );

    regionsToRemove.forEach((region) => {
      region.remove();
    });
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
      resize: false,
    };
    const regions = {
      ...this.state.regions,
      [Math.random()
        .toString(36)
        .substring(7)]: newRegion,
    };
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
  handleZoom = async (minPxPerSec = this.state.zoom) => {
    const pxPerSec = minPxPerSec < 0 ? 0 : minPxPerSec;
    const scrollParent = pxPerSec > 0;
    // Calculate progress to seek to after re-render
    const currentTime = this.state.wavesurfer.getCurrentTime();
    const progress = currentTime / this.state.wavesurfer.getDuration();
    await this.destroyWavesurfer();
    const wavesurfer = await this.initWavesurfer({ pxPerSec, scrollParent });
    const finished = await new Promise(resolve =>
      this.setState({ wavesurfer, zoom: pxPerSec }, () => {
        wavesurfer.seekAndCenter(progress);
        resolve(wavesurfer);
      }),
    );

    return finished;
  };

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
            pixelRatio: 1,
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
          resize: false,
        };
        this.setState({
          regions: { ...this.state.regions, [region.id]: stateRegion },
        });
      };

      wavesurfer.on('region-updated', (region) => {
        putRegion(region);
      });
      wavesurfer.on('region-created', (region) => {
        putRegion(region);
      });
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
          this.syncRegions();
          resolve(wavesurfer);
        });
      });
    });

  destroyWavesurfer = async () =>
    new Promise((resolve) => {
      this.state.wavesurfer.destroy();
      this.setState({ wavesurfer: null }, () => {
        resolve();
      });
    });

  /**
   * Download regions by simulating a download event
   */
  downloadLabels = () => {
    const labels = this.getLabels();

    // Blob string to download
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(labels),
    )}`;

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
    const storageAccount = this.props.containers[fullpath.substring(index + 1)]
      .storageAccount;
    const containerName = this.props.containers[fullpath.substring(index + 1)]
      .name;
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
        const className = this.state.regionsBeingPlayed.includes(region)
          ? 'info'
          : '';
        return (
          <tr className={className} key={region.id}>
            <td>
              <code>
                {moment
                  .utc(
                    moment.duration({ seconds: region.start }).asMilliseconds(),
                  )
                  .format('HH:mm:ss.SSS')}
              </code>
            </td>
            <td>
              <code>
                {moment
                  .utc(
                    moment.duration({ seconds: region.end }).asMilliseconds(),
                  )
                  .format('HH:mm:ss.SSS')}
              </code>
            </td>
            <td>
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
            <td style={{ textAlign: 'center' }}>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => this.playRegion(region.id)}
                >
                  <i className="fa fa-play" aria-hidden="true" />
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => this.removeRegion(region)}
                >
                  <i className="fa fa-trash" aria-hidden="true" />
                </button>
              </div>
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
          width: '95vw',
          height: '95vh',
          maxHeight: '95vh',
          overflowY: 'hidden',
          margin: 'auto',
          top: '2.5vh',
          position: 'relative',
          border: '1px solid black',
          padding: '1em',
          background: 'grey',
        }}
      >
        {this.state.audioSrc ? (
          <audio
            controls={false}
            src={this.state.audioSrc}
            ref={(ref) => {
              this.audio = ref;
            }}
          >
            Your browser does not support the <code>audio</code> element.
          </audio>
        ) : null}

        <div
          style={{
            margin: '0 0 1em',
          }}
        >
          <div className="btn-group">
            <button
              className="btn-play btn btn-success"
              onClick={() => this.state.wavesurfer.play()}
            >
              <i className="fa fa-play" />
            </button>
            <button
              className="btn-pause btn btn-warning"
              onClick={() => this.state.wavesurfer.pause()}
            >
              <i className="fa fa-pause" />
            </button>
            <button
              className="btn-stop btn btn-danger"
              onClick={() => this.state.wavesurfer.stop()}
            >
              <i className="fa fa-stop" />
            </button>
            <button
              className="btn-rewind btn btn-info"
              onClick={() =>
                this.state.wavesurfer.setPlaybackRate(
                  this.state.wavesurfer.getPlaybackRate() / 2,
                )}
            >
              <i className="fa fa-fast-backward" />
            </button>
            <button
              className="btn-fast-forward btn btn-info"
              onClick={() =>
                this.state.wavesurfer.setPlaybackRate(
                  this.state.wavesurfer.getPlaybackRate() * 2,
                )}
            >
              <i className="fa fa-fast-forward" />
            </button>
          </div>
          <div className="btn-group">
            <button
              className="btn-pause btn btn-primary"
              onClick={() => this.handleZoom(this.state.zoom + 20)}
            >
              <i className="fa fa-search-plus" aria-hidden="true" />
            </button>
            <button
              className="btn-pause btn btn-primary"
              onClick={() => this.handleZoom(this.state.zoom - 20)}
              disabled={this.state.zoom <= 0}
            >
              <i className="fa fa-search-minus" aria-hidden="true" />
            </button>
            <button
              className="btn-play btn btn-success"
              onClick={() => this.addRegion()}
            >
              Create Label
            </button>
          </div>
          <button
            className="btn-play btn btn-primary"
            onClick={() => this.loadPredictions()}
          >
            Load Predictions
          </button>
        </div>

        <div
          className="wavesurfer"
          style={{
            flex: '0 1 auto',
            backgroundColor: 'white',
            zIndex: 0,
            border: '1px solid ghostwhite',
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
                zIndex: 0,
              }}
            />
          </div>
        </div>

        <div
          style={{
            margin: '1em 0 0 0',
            overflowY: 'scroll',
            zIndex: 1,
            backgroundColor: 'ghostwhite',
          }}
        >
          <table
            className="table LabelList"
            style={{ width: '100%', height: '100%' }}
          >
            <thead>
              <tr>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Label</th>
                <th style={{ textAlign: 'center' }}>
                  <div className="btn-group">
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
                  </div>
                </th>
              </tr>
            </thead>
            <tbody style={{ background: 'ghostwhite' }}>{regions}</tbody>
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
  predictions: state.predictions.predictions,
});

export default connect(mapStateToProps)(PreviewVideo);
