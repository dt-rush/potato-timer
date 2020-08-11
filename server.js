#!/usr/bin/env node

const ipc = require('node-ipc');
ipc.config.id = 'potato_timer';
ipc.config.logger = console.error.bind(console);

const EventEmitter = require('eventemitter3');
const NanoTimer = require('nanotimer');

const { displaySeconds } = require('./utils');



// the Zero element in state-space
const stateZero = {
    paused: false,
    running: false,
    remaining: 0,
    label: 'idle'
};

// the state of the server
let state = {};

// set the state to zero
const zeroState = () => {
    state = Object.assign({}, stateZero);
};

// eventemitter
const events = new EventEmitter();

// emits a 'tick' event each second that passes while running and not paused
const timer = () => {
    const t = new NanoTimer();
    const iter = () => {
        if (state.running && !state.paused) {
            state.remaining--;
            if (state.remaining >= 0) {
                events.emit('tick', state.remaining);
            }
        }
    };
    t.setInterval(iter, '', '1s');
};

// IPC server for receiving commands / outputting state on request
const server = () => {
    const simpleCommands = [
        {
            on: 'start-timer',
            ack: 'started'
        },
        {
            on: 'toggle-timer',
            ack: 'toggled'
        },
        {
            on: 'stop-timer',
            ack: 'stopped'
        }
    ];
    ipc.serve(function () {
        // simple commands are simply proxies to the eventemitter with an ack message sent
        simpleCommands.forEach(c => {
            ipc.server.on(c.on, (data, socket) => {
                events.emit(c.on);
                ipc.server.emit(socket, c.ack);
            });
        });
        // get the current timer display
        ipc.server.on('get-display', (data, socket) => {
            const s = state.label == 'idle' ? 'idle' : `${state.label}: ${displaySeconds(state.remaining)}${state.paused ? ' [PAUSED]' : ''}`;
            ipc.server.emit(socket, 'display', s);
        });
    });
    ipc.server.start();
};

// sets the state to a given time segment (label + duration), running
const setTimeSegment = (label, duration) => {
    state = Object.assign(state, {
        paused: false,
        running: true,
        remaining: duration,
        label
    });
};

// modifies the state according to events, and advances through a program
const runner = (program) => {
    let i = 0;
    const next = () => setTimeSegment.apply(null, program[i]);
    const reactions = [
        {
            event: 'segment-done',
            f: (e) => {
                console.log(`${e.label} finished`);
                i++;
                i %= program.length;
                next();
            }
        },
        {
            event: 'start-timer',
            f: () => {
                i = 0;
                next();
            }
        },
        {
            event: 'toggle-timer',
            f: () => {
                state.paused = !state.paused;
            }
        },
        {
            event: 'stop-timer',
            f: () => {
                i = 0;
                zeroState();
            }
        },
    ];

    reactions.forEach(r => {
        events.on(r.event, (e) => {
            r.f(e);
            console.debug(state);
        });
    });
};

// entrypoint
const main = () => {
    zeroState();

    timer();
    server();

    const program = [
        ['FOCUS', 25 * 60],
        ['BREAK', 5 * 60],
        ['FOCUS', 25 * 60],
        ['BREAK', 5 * 60],
        ['FOCUS', 25 * 60],
        ['BREAK', 5 * 60],
        ['FOCUS', 25 * 60],
        ['LONG-BREAK', 15 * 60],
    ];
    runner(program);
    console.debug(state);
};
main();
