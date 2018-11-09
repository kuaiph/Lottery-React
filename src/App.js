import React, { Component } from "react";
import "./App.css";
import web3 from "./web3";
import lottery from "./lottery";
import ReactTable from "react-table";
import "react-table/react-table.css";

class Popup extends React.Component {
  render() {
    return (
      <div className="popup" onClick={this.props.closePopup}>
        <div className="popup_inner">
          <div className={"container"}>
            <h1>More Info</h1>
            <li>
              A pseudo-random winner is chosen every ~40,000 blocks (~1 week) by
              the{" "}
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
              Each ticket costs .01 ETH. Tickets expire after a winner is chosen
              for each round.
            </li>
          </div>
        </div>
      </div>
    );
  }
}

class App extends Component {
  state = {
    address: "",
    balance: "",
    value: "",
    message: "",
    winner: "",
    time: 0,
    tickets: 0,
    showPopup: false,
    round: 1,
    history: [],
    blockNumber: 0
  };

  async componentDidMount() {
    await web3.eth.currentProvider.enable();

    const address = await lottery.options.address;
    let round = await lottery.methods.getCurrentRound().call();
    let winner = await lottery.methods.getWinner(round - 1).call();
    let blockNumber = await lottery.methods.getBlockNumber(round).call();

    setInterval(async () => {
      let currentBlock = await web3.eth.getBlockNumber();
      this.setState({ time: this.state.blockNumber - currentBlock });
    }, 1000);

    let network = await web3.eth.net.getNetworkType();
    if (network !== "ropsten") {
      alert("Please switch to the Ropsten testnet.");
    }

    this.setState({ address, round, winner, blockNumber });
    this.updateTable();
    this.getTickets();
    this.getBalance();
  }

  updateTable = async () => {
    this.setState({ history: [] });
    for (let i = 1; i < this.state.round; i++) {
      let newBlockNumber = await lottery.methods.getBlockNumber(i).call();
      let newWinner = await lottery.methods.getWinner(i).call();
      let newAmount = await lottery.methods.getAmount(i).call();
      this.setState({
        history: this.state.history.concat([
          {
            blockNumber: newBlockNumber,
            winner: newWinner,
            amount: web3.utils.fromWei(newAmount, "ether")
          }
        ])
      });
    }
  };

  getBalance = async () => {
    let balance = await web3.eth.getBalance(this.state.address);
    this.setState({ balance });
  };

  purchaseTickets = async event => {
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    this.setState({ message: "Waiting on transaction success..." });

    await lottery.methods.purchaseTickets(this.state.value).send({
      from: accounts[0],
      value: this.state.value * 10000000000000000
    });

    this.setState({ message: "You have been entered!" });
    this.getTickets();
    this.getBalance();
  };

  pickWinner = async () => {
    const accounts = await web3.eth.getAccounts();

    await lottery.methods.pickWinner().send({
      from: accounts[0]
    });

    let winner = await lottery.methods.getWinner(this.state.round).call();
    let round = await lottery.methods.getCurrentRound().call();
    let blockNumber = await lottery.methods.getBlockNumber(round).call();

    this.setState({ winner, round, blockNumber });
    this.getTickets();
    this.updateTable();
    this.getBalance();
  };

  getTickets = async () => {
    const accounts = await web3.eth.getAccounts();

    let tickets = await lottery.methods.getTickets(accounts[0]).call();
    this.setState({ tickets });
  };

  togglePopup() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }

  render() {
    const columns = [
      {
        Header: "Block Number",
        accessor: "blockNumber"
      },
      {
        Header: "Winner",
        accessor: "winner"
      },
      {
        Header: "Amount (in ETH)",
        accessor: "amount"
      }
    ];

    return (
      <div className={"center"}>
        <h1>The Ethereum Lottery</h1>
        <p>
          The smart contract lives at at{" "}
          <a
            href={"https://ropsten.etherscan.io/address/" + this.state.address}
            target="_blank"
          >
            {this.state.address}
          </a>
          . View the code{" "}
          <a
            href={"https://github.com/samc621/Lottery-Solidity"}
            target="_blank"
          >
            here
          </a>
          .
        </p>
        <p>
          You must have{" "}
          <a href={"https://metamask.io/"} target="_blank">
            Metamask
          </a>{" "}
          installed and unlock your account on the Ropsten testnet.
        </p>
        <button onClick={this.togglePopup.bind(this)}>More Info</button>
        {this.state.showPopup ? (
          <Popup text="Close Me" closePopup={this.togglePopup.bind(this)} />
        ) : null}
        <div className={"container flexbox"}>
          <div className={"left"}>
            <p>The winner will be chosen in</p>
            <h2>~ {this.state.time} blocks</h2>
            <p>The current jackpot is </p>
            <h2>{web3.utils.fromWei(this.state.balance, "ether")} ETH</h2>
          </div>
          <div className={"right"}>
            <p>You own</p>
            <h2>{this.state.tickets} tickets</h2>
            <p>The last winner was</p>
            <h2>{this.state.winner}</h2>
          </div>
        </div>
        <div className={"container"}>
          <form onSubmit={this.purchaseTickets}>
            <h4> Want to try your luck? Buy tickets for .01 ETH each.</h4>
            <div>
              <label>Number of tickets to purchase: </label>
              <input
                value={this.state.value}
                type="number"
                onChange={event => this.setState({ value: event.target.value })}
              />
              <button>Purchase</button>
            </div>
          </form>
          <p>{this.state.message}</p>
          <button onClick={this.pickWinner.bind(this)}>Pick Winner</button>
          <h2>Previous Winners</h2>
          <ReactTable
            data={this.state.history}
            columns={columns}
            defaultPageSize="5"
            style={{ width: "100%" }}
          />
        </div>
        <div className={"footer center"}>
          <p>
            The Ethereum Lottery was created by{" "}
            <a
              href="https://samcorso.me"
              target="_blank"
              rel="noopener noreferrer"
            >
              Samuel Corso
            </a>
            .
          </p>
        </div>
      </div>
    );
  }
}

export default App;
