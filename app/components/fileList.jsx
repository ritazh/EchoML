import { connect } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import React from 'react';
import ReactDOM from 'react-dom';
import { locToUrl, responsiveValue, arrayChunk } from '../common/util';
import * as actions from '../actions';
import File from './file';

const selectedStyle = {
  backgroundColor: 'rgba(204,230,250,0.5)',
};

class FileList extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    files: React.PropTypes.array,
  };

  constructor(props) {
    super(props);
    this.state = { colPerRow: this.calcColPerRow() };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('click', this.handleWindowClick);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('click', this.handleWindowClick);
  }

  calcColPerRow() {
    const screenWidth = window.document.documentElement.clientWidth;
    return responsiveValue(screenWidth, 2, 3, 4, 4);
  }

  handleWindowResize = () => {
    clearTimeout(this.timerHandle);
    this.timerHandle = setTimeout(this.updateTimer, 16);
  }

  updateTimer = () => {
    this.setState({ colPerRow: this.calcColPerRow() });
  };

  handleWindowClick = (e) => {
    const clickedOutside = !ReactDOM.findDOMNode(this).contains(e.target);
    if (clickedOutside) {
      this.props.dispatch({ type: 'SELECT_NONE' });
    }
  };

  handleDirClick = (name) => {
    const dir = this.props.loc.dir.concat(name);
    const loc = { container: this.props.loc.container, dir };
    this.props.dispatch(actions.changeLoc(loc));
  };

  handlePreviewClick = (index) => {
    const name = this.props.files[index].name;
    this.props.dispatch(actions.loadLabels(this.props.loc, index, name));
  };

  handleToggle = (index) => {
    this.props.dispatch({ type: 'TOGGLE_FILE', index });
  };

  render() {
    const fullpath = locToUrl(this.props.loc);

    let fileIndex = 0;
    return (
      <div>
        {arrayChunk(this.props.files, this.state.colPerRow).map(chunk => (
          <Row key={chunk.reduce((acc, file) => `${acc}/${file.name}`, '')}>
            {chunk.map(file => (
              <Col
                key={file.name}
                lg={3}
                md={3}
                sm={4}
                xs={6}
                style={file.selected ? selectedStyle : {}}
              >
                <File
                  fullpath={fullpath}
                  fileIndex={fileIndex++}
                  {...file}
                  onDirClick={this.handleDirClick}
                  onPreviewClick={this.handlePreviewClick}
                  onToggle={this.handleToggle}
                />
              </Col>
          ))}
          </Row>
      ))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  containers: state.containers,
  loc: state.loc,
  files: state.files,
});

export default connect(mapStateToProps)(FileList);
