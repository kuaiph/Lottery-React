import React, { Component } from "react";
import "./App.css";
import web3 from "./web3";
import lottery from "./lottery";
import ReactTable from "react-table";
import "react-table/react-table.css";
import Popup from "./components/Popup";

class App extends Component {
  state = {
    address: "",
    balance: "",
    value: "",
    message: "",
    winner: "",
    time: 0,
    tickets: 0,
    moreInfo: false,
    wrongNetwork: false,
    noMetaMask: false,
    round: 1,
    history: [],
    blockNumber: 0
  };

  async componentDidMount() {
    if (web3.currentProvider.isMetaMask) {
      await web3.eth.currentProvider.enable();
    } else {
      this.showNoMetaMask();
    }

    let network = await web3.eth.net.getNetworkType();
    if (network !== "ropsten") {
      this.showWrongNetwork();
    }

    const address = await lottery.options.address;
    let round = await lottery.methods.getCurrentRound().call();
    let winner = await lottery.methods.getWinner(round - 1).call();
    let blockNumber = await lottery.methods.getBlockNumber(round).call();

    setInterval(async () => {
      let currentBlock = await web3.eth.getBlockNumber();
      this.setState({ time: this.state.blockNumber - currentBlock });
    }, 1000);

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

  showMoreInfo() {
    this.setState({
      moreInfo: !this.state.moreInfo
    });
  }

  showWrongNetwork() {
    this.setState({
      wrongNetwork: !this.state.wrongNetwork
    });
  }

  showNoMetaMask() {
    this.setState({
      noMetaMask: !this.state.noMetaMask
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
            rel="noopener noreferrer"
          >
            {this.state.address}
          </a>
          . View the code{" "}
          <a
            href={
              "https://github.com/samc621/Lottery-Solidity/blob/master/contracts/lottery.sol"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>
        <button onClick={this.showMoreInfo.bind(this)}>More Info</button>
        {this.state.moreInfo ? (
          <Popup
            message={"More Info"}
            closePopup={this.showMoreInfo.bind(this)}
          />
        ) : null}
        {this.state.wrongNetwork ? <Popup message={"Wrong Network"} /> : null}
        {this.state.noMetaMask ? <Popup message={"No MetaMask"} /> : null}
        <div className={"container flexbox"}>
          <div className={"left"}>
            <p>Winner chosen in</p>
            <h2>~ {this.state.time} blocks</h2>
          </div>
          <div className={"right"}>
            <p>You own</p>
            <h2>{this.state.tickets} tickets</h2>
          </div>
        </div>
        <div className={"container flexbox"}>
          <div className={"left"}>
            <p>Current jackpot is </p>
            <h2>{web3.utils.fromWei(this.state.balance, "ether")} ETH</h2>
          </div>
          <div className={"right"}>
            <p>Last winner was</p>
            <h2 className={"word-break"}>{this.state.winner}</h2>
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
            defaultPageSize={5}
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
