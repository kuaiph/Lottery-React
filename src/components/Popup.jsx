import React, { Component } from "react";

export default class Popup extends Component {
  render() {
    const message = this.props.message;
    if (message === "More Info") {
      return (
        <div className="popup" onClick={this.props.closePopup}>
          <div className="popup_inner">
            <div className={"container"}>
              <h1>More Info</h1>
              <li>
                A pseudo-random winner is chosen every ~40,000 blocks (~1 week)
                by the{" "}
                <a
                  href="https://www.ethereum-alarm-clock.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ethereum Alarm Clock (EAC)
                </a>
                .
              </li>
              <li>
                A ~.01 ETH fee is paid to the EAC for choosing the winner. The
                rest is given to the winner.
              </li>
              <li>
                Each ticket costs .01 ETH. Tickets expire after a winner is
                chosen for each round.
              </li>
            </div>
          </div>
        </div>
      );
    } else if (message === "Wrong Network") {
      return (
        <div className="popup">
          <div className="popup_inner vertical_align">
            <div className={"container"}>
              <h1>Please switch MetaMask to the Ropsten testnet.</h1>
            </div>
          </div>
        </div>
      );
    } else if (message === "No MetaMask") {
      return (
        <div className="popup">
          <div className="popup_inner vertical_align">
            <div className={"container"}>
              <h1>
                You need to install{" "}
                <a href={"https://metamask.io/"} target="_blank">
                  MetaMask
                </a>{" "}
                in your browser.
              </h1>
            </div>
          </div>
        </div>
      );
    }
  }
}
