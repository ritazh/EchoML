import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import FileIcon from './fileIcon';

export default class File extends React.Component {
  static propTypes = {
    name: React.PropTypes.string,
    fullpath: React.PropTypes.string,
    fileIndex: React.PropTypes.number,
    size: React.PropTypes.string,
    mtime: React.PropTypes.string,
    isDirectory: React.PropTypes.bool,
    selected: React.PropTypes.bool,
    onDirClick: React.PropTypes.func,
    onPreviewClick: React.PropTypes.func,
    onToggle: React.PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  handleClick = () => {
    if (this.props.isDirectory) {
      this.props.onDirClick(this.props.name);
    } else {
      this.props.onPreviewClick(this.props.fileIndex);
    }
  };

  handleIconClick = (e) => {
    e.stopPropagation(); // to prevent handleClick
    this.props.onToggle(this.props.fileIndex);
  };

  render() {
    return (
      <div
        onClick={this.handleClick}
        style={{ padding: '5px 0px' }}
      >
        <div
          style={{
            float: 'left',
            width: '50px',
            verticalAlign: 'top',
          }}
        >
          <FileIcon
            directory={this.props.isDirectory}
            filename={this.props.name}
            selected={this.props.selected}
            onClick={this.handleIconClick}
          />
        </div>
        <div
          style={{
            marginLeft: '60px',
            paddingBottom: '3px',
            borderBottom: '1px solid #eee',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              marginBottom: '5px',
            }}
          >
            {this.props.name}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#aaa',
            }}
          >
            <span>
              {this.props.isDirectory ? 'Directory' : this.props.size}
            </span>
            <span className="pull-right hidden-xs">
              {this.props.mtime}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
