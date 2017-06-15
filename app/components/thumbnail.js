import path from 'path';
import React from 'react';

export default class Thumbnail extends React.Component {
  static propTypes = {
    name: React.PropTypes.string,
    fullpath: React.PropTypes.string,
    fileIndex: React.PropTypes.number,
    isDirectory: React.PropTypes.bool,
    onDirClick: React.PropTypes.func,
    onPreviewClick: React.PropTypes.func,
  };

  handleClick = () => {
    if (this.props.isDirectory) {
      this.props.onDirClick(this.props.name);
    } else {
      this.props.onPreviewClick(this.props.fileIndex);
    }
  };

  render() {
    const style = {
      width: '100px',
      height: '100px',
      marginRight: '1px',
      marginBottom: '1px',
    };
    if (path.extname(this.props.name).toLowerCase() === '.jpg') {
      return (
        <img
          style={style}
          src={`${API_HOST}/api/image${this.props.fullpath}/${this.props.name}?type=sq100`}
          alt={this.props.name}
          onClick={this.handleClick}
        />
      );
    }

    const divStyle = {
      ...style,
      display: 'inline-block',
      verticalAlign: 'top',
      backgroundColor: '#eee',
    };

    const innerStyle = {
      margin: '10px 10px',
      wordWrap: 'break-word',
    };

    return (
      <div
        style={divStyle}
        onClick={this.handleClick}
      >
        <div style={innerStyle}>
          {this.props.name}
        </div>
      </div>
    );
  }
}
