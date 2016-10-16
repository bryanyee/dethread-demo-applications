import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import Pending from './Pending';
import Performance from './Performance';
import Participate from './Participate';
import WorkerProcess from './WorkerProcess';
import Success from './Success';
import Host from './Host';
import { initSocket } from '../Socket';
import { startWorkers, terminateAllWorkers } from './PerfInputs';

let socket; 

class JoinSession extends Component {
	constructor() {
		super(); 
		this.state = {
			userParticipation: false,
			ready: false,
			hasMaster: false,
			isMaster: false,
			calculating: false,
			globalConnections: undefined,
			globalWorkers: undefined,
			globalNumCombos: undefined,
			clearText: undefined,
			duration: undefined,
			length: undefined,
			workers: undefined,
			optimalWorkers: undefined,
			hash: undefined,
			begin: undefined,
			end: undefined,
		};

		this.startSocketConnection = this.startSocketConnection.bind(this);
		this.claimMaster = this.claimMaster.bind(this);
		this.updateSettings = this.updateSettings.bind(this);
		this.chooseWorkerCount = this.chooseWorkerCount.bind(this);
		this.startMD5Decrypt = this.startMD5Decrypt.bind(this);
		this.startWork = this.startWork.bind(this);
		this.passwordCracked = this.passwordCracked.bind(this);
	}

	componentDidMount() {
	  terminateAllWorkers();
	}

	startSocketConnection() {
		socket = initSocket(io);

		socket.on('client-connected-response', (data) => {
			this.setState({ hasMaster: data.hasMaster, userParticipation: true });
		});

		socket.on('claim-master-response', (data) => {
			this.setState({ globalConnections: data.globalConnections });
		});

		socket.on('master-claimed', (data) => {
			this.setState({ hasMaster: true, globalConnections: data.globalConnections });
		});

		socket.on('new-client-ready', (data) => {
			console.log("data.globalWorkers!!!!!!!!!!", data.globalWorkers);
			this.setState({ globalConnections: data.globalConnections, globalWorkers: data.globalWorkers });
		});

		socket.on('start-work', this.startWork);

		socket.on('password-found', (data) => {
			console.log('password-found', data);
			socket.disconnect();
			terminateAllWorkers();
			this.setState({ clearText: data.clearText, duration: data.duration });
		});

		socket.on('master-disconnected', () => {
			socket.disconnect();
			terminateAllWorkers();
			browserHistory.push('MasterDisconnect');
		});

		socket.on('connect_error', (e) => {
		  console.log('connection error', socket.id);
		});

		socket.on('reconnect', () => {
		  console.log('socket reconnected', socket.id);
		})

		socket.on('reconnect_error', (e) => {
		  console.log('reconnect connection error', socket.id);
		})

		socket.on('client-disconnect', (data) => {
			this.setState({globalConnections: data.globalConnections, globalWorkers: data.globalWorkers});
			console.log("client disconnected ");
		})

		const optimalWorkers = (navigator.hardwareConcurrency / 2) + 1;
		this.setState({ optimalWorkers });
	}

	claimMaster() {
		socket.emit('claim-master');
		this.setState({ hasMaster: true, isMaster: true, ready: true });
	}

	updateSettings(name, e) {
	  const toChange = name;
	  const stateVal = this.state[toChange];
	  const stateUpdate = {};
	  if (name === 'workers' || name === 'length' ) stateUpdate[toChange] = Number(e.target.value);
	  else stateUpdate[toChange] = e.target.value;
	  this.setState(stateUpdate);   
	}

	chooseWorkerCount() {
		socket.emit('client-ready', { ready: true, workers: this.state.workers });
		this.setState({ ready: true });
	}

	startMD5Decrypt() {
	  console.log('start decryption hash', this.state.hash);

	  socket.emit('start-decryption', { hash: this.state.hash, length: this.state.length, workers: this.state.workers });
	}

	startWork(data) {
		const newState = {
			startTime: data.startTime,
			length: data.length,
			globalNumCombos: data.globalNumCombos,
			globalWorkers: data.globalWorkers,
			hash: data.hash,
			begin: data.begin,
			end: data.end,
			calculating: true,
		};
		console.log("startWork server", data);
		startWorkers(this.passwordCracked, data.begin, data.end, this.state.workers, data.hash, data.length, data.startTime);
		this.setState(newState);
	}

	passwordCracked(clearText, duration) {
		const data = {
			clearText,
			duration,
		};
		
		socket.emit('password-cracked', data);
		this.setState(data);
	}

	render() {
		const sessionView = !this.state.userParticipation ? <Participate startSocketConnection={this.startSocketConnection} /> 
						 : !this.state.hasMaster ? <Host claimMaster={this.claimMaster} /> 
						 : this.state.isMaster ? <Performance {...this.state} updateSettings={this.updateSettings} startMD5Decrypt={this.startMD5Decrypt} /> 
						 : !this.state.calculating || !this.state.ready ? <Pending ready={this.state.ready} optimalWorkers={this.state.optimalWorkers} workers={this.state.workers} updateSettings={this.updateSettings} chooseWorkerCount={this.chooseWorkerCount} globalConnections={this.state.globalConnections} />
						 : <WorkerProcess {...this.state} />;
		return (	<div>
								{sessionView}
							</div>
		)
	}
}

export default JoinSession;