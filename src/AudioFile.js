import React from "react";
import PropTypes from "prop-types";
import { Link, Redirect } from "react-router-dom";
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugin/wavesurfer.spectrogram";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
import MinimapPlugin from "wavesurfer.js/dist/plugin/wavesurfer.minimap";
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline";
import moment from "moment";
import Paper from "material-ui/Paper";
import IconButton from "material-ui/IconButton";
import Typography from "material-ui/Typography";
import PlayArrowIcon from "material-ui-icons/PlayArrow";
import FastForward from "material-ui-icons/FastForward";
import FastRewind from "material-ui-icons/FastRewind";
import PauseIcon from "material-ui-icons/Pause";
import NoteAddIcon from "material-ui-icons/NoteAdd";
import SaveIcon from "material-ui-icons/Save";
import DownloadIcon from "material-ui-icons/FileDownload";
import DeleteIcon from "material-ui-icons/Delete";
import ZoomInIcon from "material-ui-icons/ZoomIn";
import ZoomOutIcon from "material-ui-icons/ZoomOut";
import { LinearProgress } from "material-ui/Progress";
import Tooltip from "material-ui/Tooltip";
import Snackbar from "material-ui/Snackbar";
import Table, { TableBody, TableCell, TableHead, TableRow } from "material-ui/Table";
import { utcToZonedTime, format } from "date-fns-tz";
import { GlobalHotKeys } from "react-hotkeys";
import { downloadFile } from "./lib/azure";
import { loadLabels, saveLabels } from "./lib/labels";

class AudioFile extends React.Component {
  /**
   * Generate a random color of gradient
   */
  static randomColor = (gradient = 0.5) =>
    `rgba(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(
      Math.random() * 256,
    )}, ${gradient})`;

  constructor(props) {
    super(props);
    this.activeLabelRows = [];
    this.state = {
      ...props,
      audioUrl: "",
      defaultLabel: localStorage.getItem("defaultLabel") || "",
      redirectTo: undefined,
      // Wavesurver stuff
      regions: [],
      wavesurfer: null,
      wavesurferReady: false,
      // spectrogramEnabled: false,
      zoom: 0,
      wavesurferShouldScroll: false,
      regionsBeingPlayed: [],
      loadingProgress: 0,
    };
  }

  componentDidMount() {
    this.triggerNewFileDownload();
  }

  componentDidUpdate(prevProps) {
    // Scroll label table to show currently playing
    const currentlyPlaying = this.activeLabelRows.filter(e => e).pop();
    if (currentlyPlaying) {
      currentlyPlaying.scrollIntoView({ block: "end", behavior: "smooth" });
    }

    if (prevProps.filename !== this.props.filename) {
      this.destroyWavesurfer().then(() => this.triggerNewFileDownload());
    }
  }

  componentWillUnmount() {
    if (this.state.wavesurfer) {
      this.state.wavesurfer.destroy();
    }
  }

  /**
   * merge and return wavesurfer regions and labels data from component state
   */
  getLabels = () => {
    const labels = Object.values(this.state.wavesurfer.regions.list)
      .map(region => {
        const { start, end } = region;
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
        label: region.label || "",
      }));

    return labels;
  };

  /**
   * Sync regions from state and predictions from props to wavesurfer
   * call this whenever a wavesurfer region is modified
   * @return {Promise}
   */
  syncRegions = () => {
    const wavesurverRegions = this.state.wavesurfer.regions.list;
    // Add/update regions in wavesurfer from state
    Object.entries(this.state.regions).forEach(([id, region]) => {
      const color = wavesurverRegions[id] ? wavesurverRegions[id].color : AudioFile.randomColor();
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

    regionsToRemove.forEach(region => {
      region.remove();
    });
  };

  /**
   * Add a new segment at the players current time
   */
  addRegion = () => {
    const currentTime = this.state.wavesurfer.getCurrentTime();
    const newRegion = {
      start: currentTime - 1,
      end: currentTime + 1,
      label: this.state.defaultLabel,
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
   * Remove segment at index and refresh local player
   */
  removeRegion = region => {
    // region.remove();
    const regions = { ...this.state.regions };
    delete regions[region.id];
    this.setState({ regions }, () => this.syncRegions());
  };

  /**
   * Play the segement referred to by segmentId
   */
  playRegion = segmentId => {
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

  initWavesurfer = async (options = {}) =>
    new Promise(resolve => {
      const wavesurfer = WaveSurfer.create({
        container: this.wavesurfer,
        waveColor: "violet",
        progressColor: "purple",
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
      wavesurfer.on("loading", loadingProgress => {
        this.setState({ loadingProgress });
      });

      /**
       * Add/update the provided region in state
       * @param {WavesurferRegion} region
       */
      const putRegion = region => {
        const existingRegion = this.state.regions[region.id];
        const stateRegion = {
          start: region.start,
          end: region.end,
          label: existingRegion ? existingRegion.label : "",
          resize: false,
        };
        this.setState({
          regions: { ...this.state.regions, [region.id]: stateRegion },
        });
      };

      wavesurfer.on("region-updated", region => {
        putRegion(region);
      });
      wavesurfer.on("region-created", region => {
        putRegion(region);
      });
      wavesurfer.on("region-in", region => {
        this.setState({
          regionsBeingPlayed: [...this.state.regionsBeingPlayed, region],
        });
      });
      wavesurfer.on("region-out", region => {
        const regionsBeingPlayed = [...this.state.regionsBeingPlayed].filter(
          filterRegion => filterRegion.id !== region.id,
        );
        this.setState({ regionsBeingPlayed });
      });

      // Resolve wavesurfer instance
      wavesurfer.on("ready", () => {
        // bind wavesurfer and add label metadata to state
        this.setState({ wavesurfer, wavesurferReady: true }, () => {
          this.syncRegions();
          resolve(wavesurfer);
        });
      });
    }).catch(err => {
      console.error(err);
    });

  destroyWavesurfer = async () =>
    new Promise(resolve => {
      this.state.wavesurfer.destroy();
      this.setState({ wavesurfer: null, wavesurferReady: false }, () => {
        resolve();
      });
    });

  saveLabels = async () => {
    try {
      const response = await saveLabels(
        this.props.storageAccount,
        this.props.container,
        this.props.filename,
        this.getLabels(),
      );
      this.showMessage(`${response.length} Labels successfully saved.`);
    } catch (err) {
      this.showMessage(err.message);
    }
  };

  goToNextFile = () => {
    const { storageAccount, container, nextFilename } = this.props;
    this.setState({
      redirectTo: `/${storageAccount}/${container}/${nextFilename}`
    });
  };

  goToPreviousFile = () => {
    const { storageAccount, container, previousFilename } = this.props;
    this.setState({
      redirectTo: `/${storageAccount}/${container}/${previousFilename}`
    });
  };

  /**
   * Download regions by simulating a download event
   */
  downloadLabels = () => {
    const labels = this.getLabels();

    // Blob string to download
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(labels))}`;

    // Create fake download element and click
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "labels.json");
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  showMessage = (message = "") => {
    this.setState({
      snackbarOpen: true,
      snackbarMessage: message,
    });
  };

  handleSnackbarRequestClose = () => {
    this.setState({ snackbarOpen: false });
  };

  triggerNewFileDownload = () => {
    return downloadFile(this.props.storageAccount, this.props.container, this.props.filename)
      .then(url => {
        this.setState({ audioUrl: url });
      })
      .then(() => {
        this.initWavesurfer().then(() => {
          loadLabels(this.props.storageAccount, this.props.container, this.props.filename).then(
            labels => {
              const regions = [];
              labels.forEach(label => {
                regions[
                  Math.random()
                    .toString(36)
                    .substring(10)
                ] = label;
              });
              this.setState(
                {
                  regions,
                },
                () => {
                  this.syncRegions();
                },
              );
            },
          );
        });
      })
      .catch(e => {
        console.error(e);
        this.showMessage("Error downloading audio file");
      });
  };

  render() {
    const { redirectTo } = this.state;
    if (redirectTo) {
      return (<Redirect to={redirectTo} />);
    }
    this.activeLabelRows = [];
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
      .map(region => {
        const style = {
          ...(this.state.regionsBeingPlayed.includes(region) ? { color: "red" } : {}),
          height: "1em",
        };
        const refLamda = this.state.regionsBeingPlayed.includes(region)
          ? ref => {
              this.activeLabelRows.push(ref);
            }
          : () => {};
        return (
          <TableRow style={style} key={region.id}>
            <TableCell style={{ padding: "0 1em" }}>
              <code ref={refLamda}>
                {moment
                  .utc(moment.duration({ seconds: region.start }).asMilliseconds())
                  .format("HH:mm:ss.SSS")}
              </code>
            </TableCell>
            <TableCell style={{ padding: "0 1em" }}>
              <code>
                {moment
                  .utc(moment.duration({ seconds: region.end }).asMilliseconds())
                  .format("HH:mm:ss.SSS")}
              </code>
            </TableCell>
            <TableCell style={{ padding: "0 1em" }}>
              <input
                style={{ width: "100%" }}
                contentEditable
                onChange={e => {
                  this.updateRegion(region, { label: e.target.value });
                }}
                value={this.state.regions[region.id].label}
              />
            </TableCell>
            <TableCell style={{ padding: "0 1em", display: "flex" }}>
              <PlayArrowIcon
                style={{ cursor: "pointer" }}
                onClick={() => {
                  this.playRegion(region.id);
                }}
              />
              <DeleteIcon
                style={{ cursor: "pointer" }}
                onClick={() => {
                  this.removeRegion(region);
                }}
              />
            </TableCell>
          </TableRow>
        );
      });

    const { filename, storageAccount, container, nextFilename, previousFilename } = this.props;

    const blobDate = filename
      .replace(".wav.mp3", "")
      .split(" ")
      .join("T")
      .concat("Z");
    const zonedDate = utcToZonedTime(blobDate, "America/Los_Angeles");
    const localTime = format(zonedDate, "eee yyyy-MM-dd h:mma (z)");

    const keyMap = {
      SAVE_LABEL: "ctrl+s",
      ADD_LABEL: "ctrl+n",
      PLAY: "space",
      NEXT_AUDIO_FILE: "ctrl+j",
      PREVIOUS_AUDIO_FILE: "ctrl+k",
    };

    const hotkeysHandlers = {
      SAVE_LABEL: this.saveLabels,
      ADD_LABEL: this.addRegion,
      PLAY: () => this.state.wavesurfer.playPause(),
      NEXT_AUDIO_FILE: this.goToNextFile,
      PREVIOUS_AUDIO_FILE: this.goToPreviousFile,
    };

    return (
      <GlobalHotKeys keyMap={keyMap} handlers={hotkeysHandlers}>
        <div className="AudioFile">
          <Paper style={{ padding: "1em" }}>
            <Typography type="headline">{filename}</Typography>
            <Typography type="subheading">{localTime}</Typography>
            <Link
              to={`/${storageAccount}/${container}/${previousFilename}`}
              href={`/${storageAccount}/${container}/${previousFilename}`}
              key={`/${storageAccount}/${container}/${previousFilename}`}
              style={{ textDecoration: "none", color: "black" }}
            >
              Previous
            </Link>
            &nbsp;-&nbsp;
            <Link
              to={`/${storageAccount}/${container}/${nextFilename}`}
              href={`/${storageAccount}/${container}/${nextFilename}`}
              key={`/${storageAccount}/${container}/${nextFilename}`}
              style={{ textDecoration: "none", color: "black" }}
            >
              Next
            </Link>
            &nbsp;-&nbsp;
            <Link to={`/${storageAccount}/${container}`}>Back to container</Link>
            {/* Audio Download Progress */}
            {this.state.loadingProgress < 100 && (
              <div>
                <p>Downloading Audio File...</p>
                {/* <LinearProgress mode="determinate" value={this.state.loadingProgress} /> */}
                <LinearProgress />
              </div>
            )}
            {/* Audio downloade, WaveSurfer decoding and drawing */}
            {this.state.loadingProgress >= 100 && !this.state.wavesurferReady && (
              <div>
                <p>Analysing Audio Data...</p>
                <LinearProgress />
              </div>
            )}
            {/* Wavesurfer ready; render labels and player */}
            <div className="editor">
              <div>
                <Tooltip title="Play">
                  <IconButton aria-label="Play" onClick={() => this.state.wavesurfer.play()}>
                    <PlayArrowIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Pause">
                  <IconButton aria-label="Pause" onClick={() => this.state.wavesurfer.pause()}>
                    <PauseIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Decrease Playback Rate">
                  <IconButton
                    aria-label="Fast Rewind"
                    onClick={() =>
                      this.state.wavesurfer.setPlaybackRate(
                        this.state.wavesurfer.getPlaybackRate() / 2,
                      )
                    }
                  >
                    <FastRewind />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Increase Playback Rate">
                  <IconButton
                    aria-label="Fast Forward"
                    onClick={() =>
                      this.state.wavesurfer.setPlaybackRate(
                        this.state.wavesurfer.getPlaybackRate() * 2,
                      )
                    }
                  >
                    <FastForward />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom In">
                  <IconButton
                    aria-label="Zoom In"
                    onClick={() => this.handleZoom(this.state.zoom + 20)}
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <IconButton
                    aria-label="Zoom Out"
                    onClick={() => this.handleZoom(this.state.zoom - 20)}
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Add Label">
                  <IconButton
                    aria-label="Add Label"
                    onClick={() => {
                      this.addRegion();
                    }}
                  >
                    <NoteAddIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Save Labels">
                  <IconButton aria-label="Save Labels" onClick={() => this.saveLabels()}>
                    <SaveIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Download Labels">
                  <IconButton aria-label="Download Labels" onClick={() => this.downloadLabels()}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "row" }}>
                <Paper className="waveform" style={{ flex: "auto", minWidth: "30vw" }}>
                  <audio
                    controls={false}
                    src={this.state.audioUrl}
                    ref={ref => {
                      this.audio = ref;
                    }}
                  >
                    Your browser does not support the <code>audio</code> element.
                  </audio>
                  <div
                    className="wavesurfer"
                    style={{
                      backgroundColor: "white",
                      zIndex: 0,
                      border: "1px solid ghostwhite",
                    }}
                  >
                    <div
                      style={{
                        display: this.state.loadingProgress === 100 ? "initial" : "none",
                      }}
                    >
                      <div
                        ref={ref => {
                          this.wavesurfer = ref;
                        }}
                      />
                      <div
                        ref={ref => {
                          this.wavesurferTimeline = ref;
                        }}
                      />
                      <div
                        ref={ref => {
                          this.wavesurferSpectrogram = ref;
                        }}
                        style={{
                          textAlign: "start",
                          padding: "-1em 0 0 0",
                          zIndex: 0,
                        }}
                      />
                    </div>
                  </div>
                </Paper>
                <Paper className="controls" style={{ flex: "1" }}>
                  <Table style={{ height: "438px", display: "block", overflow: "scroll" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell numeric>Start</TableCell>
                        <TableCell numeric>End</TableCell>
                        <TableCell>Label</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {regions.length > 0 ? (
                        regions
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>
                            {this.state.wavesurferReady ? <p>No labels</p> : <LinearProgress />}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </div>
            </div>
          </Paper>
          <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            open={this.state.snackbarOpen}
            onClose={this.handleSnackbarRequestClose}
            SnackbarContentProps={{
              "aria-describedby": "message-id",
            }}
            message={<span id="message-id">{this.state.snackbarMessage}</span>}
          />
        </div>
      </GlobalHotKeys>
    );
  }
}

AudioFile.propTypes = {
  storageAccount: PropTypes.string.isRequired,
  container: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
  nextFilename: PropTypes.string.isRequired,
  previousFilename: PropTypes.string.isRequired,
};

export default AudioFile;
