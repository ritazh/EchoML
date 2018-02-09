import React from "react";
import PropTypes from "prop-types";
import Card, { CardContent } from "material-ui/Card";
import Typography from "material-ui/Typography";
import "./NotFoundCard.css";

function NotFoundCard(props) {
  return (
    <div>
      <Card className="card">
        <CardContent>
          <Typography type="body1" className="title">
            {props.title}
          </Typography>
          <Typography type="headline" component="h2">
            {props.heading}
          </Typography>
          <Typography type="body1" className="pos">
            {props.subheading}
          </Typography>
          <Typography component="pre" style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {props.description}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

NotFoundCard.propTypes = {
  title: PropTypes.string,
  heading: PropTypes.string,
  subheading: PropTypes.string,
  description: PropTypes.string,
};

NotFoundCard.defaultProps = {
  title: "404 Not Found",
  heading: "Hmm. We’re having trouble finding this link.",
  subheading: `We can’t connect to the page ${window.location}`,
  description: `If that address is correct, here are three other things you can try:
  
      - Try again later.
      - Check your network connection.
      - If you are connected behind a firewall or storage has special permissions; check to see your credentials has permission to access this resource.`,
};

export default NotFoundCard;
