import React, { Component } from 'react';

const Success = function(props) {
  const dur = props.duration <= 1 ? 'second' : 'seconds';
  
  return (<div>
            <div className="success">
              <h2> Success! </h2>
              <p className="successText">We found this password: {props.clearText} in {props.duration} {dur}</p>
            </div>
          </div>)
};

export default Success;