import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Button from "material-ui/Button";
import Card, { CardContent, CardHeader } from "material-ui/Card";
import List, { ListItem, ListItemIcon, ListItemText } from "material-ui/List";
import MusicNoteIcon from "material-ui-icons/MusicNote";
import PhotoIcon from "material-ui-icons/Photo";
import MovieIcon from "material-ui-icons/Movie";
import TextIcon from "material-ui-icons/TextFormat";
import FolderIcon from "material-ui-icons/Folder";
import ErrorIcon from "material-ui-icons/Error";
import { utcToZonedTime, format } from "date-fns-tz";

import Input, { InputLabel } from "material-ui/Input";
import { FormControl } from "material-ui/Form";

import { downloadAllLabels } from "./lib/labels";
import { getBlobs } from "./lib/azure";

async function downloadLabels(containerName) {
  const labels = await downloadAllLabels(containerName);

  // Blob string to download
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(labels))}`;

  // Create fake download element and click
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "labels.json");
  dlAnchorElem.click();
  dlAnchorElem.remove();
}

function getIcon(contentType) {
  let icon = <ErrorIcon />;
  if (contentType.match(/audio/i)) {
    icon = <MusicNoteIcon />;
  } else if (contentType.match(/image/i)) {
    icon = <PhotoIcon />;
  } else if (contentType.match(/video/i)) {
    icon = <MovieIcon />;
  } else if (contentType.match(/text/i)) {
    icon = <TextIcon />;
  }

  return icon;
}

class Container extends React.PureComponent {
  static propTypes = {
    storageAccount: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    lastModified: PropTypes.string,
  };

  static defaultProps = {
    lastModified: "",
  };

  state = {
    blobs: [],
    defaultLabel: localStorage.getItem("defaultLabel") || "",
  };

  changeDefaultLabel = e => {
    const defaultLabel = e.target.value;
    localStorage.setItem("defaultLabel", defaultLabel);
    this.setState({ defaultLabel });
  };

  componentDidMount = () => {
    const { name } = this.props;
    getBlobs(name).then(blobs => this.setState({ blobs }));
  };

  render() {
    const { storageAccount, name } = this.props;
    const { blobs } = this.state;
    const listItems = [];
    let currentPath = [];
    blobs.forEach(blob => {
      const { contentType = "" } = blob;
      const icon = getIcon(contentType);
      const filepath = blob.name.split("/");

      const blobDate = blob.name
        .replace(".wav", "")
        .replace(".mp3", "")
        .split(" ")
        .join("T")
        .concat("Z");
      const zonedDate = utcToZonedTime(blobDate, "America/Los_Angeles");
      const localTime = format(zonedDate, "eee yyyy-MM-dd h:mma (z)");

      filepath.forEach((node, index) => {
        const path = [...filepath].splice(0, filepath.length - 1);
        const pathString = JSON.stringify(path);
        const currentPathString = JSON.stringify(currentPath);
        if (currentPathString !== pathString) {
          currentPath = path;
        }

        const url = `/${storageAccount}/${name}/${blob.name}`;

        if (index + 1 === filepath.length) {
          const link = (
            <Link
              to={
                contentType.match(/audio/i) ? url : window.location.pathname // dont do anything for non-audio
              }
              key={url}
              style={{ textDecoration: "none", color: "black" }}
            >
              <ListItem button style={{ paddingLeft: `${currentPath.length * 2}em` }} key={url}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText
                  primary={node}
                  secondary={`${(blob.contentLength * 0.000001).toFixed(2)} MB | ${localTime}`}
                />
              </ListItem>
            </Link>
          );
          listItems.push(link);
        }

        // create new folder if in different path
        if (currentPathString !== pathString) {
          path.forEach(folderName => {
            if (currentPathString.indexOf(folderName) < 0) {
              const item = (
                <ListItem
                  button
                  style={{ paddingLeft: `${(currentPath.length - 1) * 2}em` }}
                  key={`${currentPath.join("/")}/${folderName}`}
                >
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText inset primary={folderName} />
                </ListItem>
              );
              listItems.push(item);
            }
          });
        }
      });
    });

    return (
      <div className="Container">
        <Card>
          <CardHeader title={this.props.name} subheader={this.props.lastModified} />
          <CardContent>
            <FormControl aria-describedby="name-helper-text" style={{ marginRight: "1em" }}>
              <InputLabel htmlFor="name-helper">Default Label</InputLabel>
              <Input
                id="name-helper"
                value={this.state.defaultLabel}
                onChange={this.changeDefaultLabel}
              />
            </FormControl>
            <Button color="primary" onClick={() => downloadLabels(this.props.name)}>
              Download Labels
            </Button>
            <List dense>{listItems}</List>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default Container;
