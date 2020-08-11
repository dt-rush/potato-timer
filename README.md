potato-timer
===

Simple program for work/break alternating timing.

In europe, using the italian word for tomato (pomodoro) to name this project would be violating a copyright. Feel free to call this timer whatever you want in your own personal home. We'll call it potato timer here for the sake of avoiding italian prison.

![start timer image](/screenshots/start.png)
![timer running image](/screenshots/timer.png)
![paused timer image](/screenshots/paused.png)
![break timer image](/screenshots/break.png)

# Install

(requires nodejs to be installed on your system)

```
npm i -g potato-timer
```

# Basic usage:

### start server

```
# start the server (you probably want to put this in your xinitrc, 
# i3 config, or make a systemd --user unit)

(potato-timer-server &)
```

### commands (once server is running)

```
potato-timer-cli start-timer
potato-timer-cli get-display
potato-timer-cli toggle-timer
potato-timer-cli stop-timer
```

# Polybar config

This is how the potato timer is meant to be experienced - as a vivid first-person multimedia interactive experiences:

```
[module/potatotimer]
type = custom/script

; click actions
click-left = potato-timer-cli start-timer
click-middle = potato-timer-cli toggle-timer
click-right = potato-timer-cli stop-timer

; rewrite and style the component
; idle state -> [ START FOCUS ]
; FOCUS state -> timer only (with red background)
; BREAK* state -> timer only (with green background)
exec = potato-timer-cli get-display 2>/dev/null | sed 's/idle$/[ START FOCUS ]/' | sed -r 's/FOCUS: (.+)/%{B#800}        \1        /' | sed -r 's/(.*BREAK.+)/%{B#080}        \1        /'

; evaluate 10 times a second to waste your CPU
interval = 0.1

; red underline
format-underline = #800

; you should have a line in your config: `font-4 = ... (whatever font you like)`
format-font = 4
```
