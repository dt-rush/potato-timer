const padZero = (n) => ('0'+n).slice(-2);
const displaySeconds = (seconds) => padZero(Math.floor(seconds / 60)) + ':' + padZero(Math.floor(seconds % 60));

module.exports = {
    displaySeconds
};
