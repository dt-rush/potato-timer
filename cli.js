#!/usr/bin/env node

const ipc = require('node-ipc');
ipc.config.logger = console.error.bind(console);
ipc.config.retry = 100;
ipc.config.sync = true;
ipc.config.maxRetries = 5;

// commands send a message to the server and wait on an ack message, optionally with a callback
const commands = [
    {
        send: 'start-timer',
        ack: 'started'
    },
    {
        send: 'toggle-timer',
        ack: 'toggled'
    },
    {
        send: 'stop-timer',
        ack: 'stopped'
    },
    {
        send: 'get-display',
        ack: 'display',
        callback: async (data) => {
            console.log(data);
        }
    }
];
// used if a command doesn't have a callback
const nullCallback = async () => {};

const runCommand = (c) => {
    // connect to server
    ipc.connectTo('potato_timer', () => {
        ipc.of.potato_timer.on('connect', () => {
            // set up ack receiver
            ipc.of.potato_timer.on(c.ack, (data) => {
                (c.callback || nullCallback)(data)
                .then(() => {
                    ipc.disconnect('potato_timer');
                });
            });
            // send message
            ipc.of.potato_timer.emit(c.send);
        });
    });
};

const main = () => {
    // parse arg
    if (process.argv.length != 3) {
        console.error('usage: ${program} [start|toggle|stop|get_display]');
        process.exit(1);
    }
    const arg = process.argv[2];
    // act on command
    const cmd = commands.find((o) => o.send === arg);
    if (!cmd) {
        console.error(`${arg} is not a recognized option.`);
        process.exit(1);
    }
    runCommand(cmd);
};
main();
