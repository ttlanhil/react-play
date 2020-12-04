import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
    return (
        <button className={"square" + (props.open ? ' open' : '')} onClick={props.onClick} onContextMenu={props.onContextMenu}>
            {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
                key={i}
                // only show value once opened, otherwise show if it has a flag
                value={this.props.squares[i].open ? this.props.squares[i].value : this.props.squares[i].flagged}
                open={this.props.squares[i].open}
                onClick={() => this.props.onClick(i)}
                onContextMenu={(e) => this.props.onContextMenu(i, e)}
            />
        );
    }

    render() {
        const width = this.props.width;
        const height = this.props.height;
        return (
            <div>
                {[...Array(height)].map((_, x) =>
                    <div className="board-row" key={"row_"+x}>
                    {[...Array(width)].map(
                        (_, y) => {return this.renderSquare(x * width + y)}
                    )}
                    </div>
                )}
            </div>
        );
    }
}

class ElapsedTime extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            seconds: 0,
        };
    }

    tick() {
        this.setState(state => ({
            seconds: state.seconds + 1
        }));
    }

    componentDidUpdate() {
        // respond to updates each tick (triggering state updates) or changes in props
        if (this.props.stopped) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (! this.interval) {
            this.interval = setInterval(() => this.tick(), 1000);
            this.setState({seconds: 0});
        }
    }

    stopTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    componentDidMount() {
        this.startTimer();
    }

    componentWillUnmount() {
        this.stopTimer();
    }

    formatTimeSince(elapsed) {
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor(elapsed / 60 % 60);
        const seconds = Math.floor(elapsed % 60);

        if (hours) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    render() {
        return (
            <span>Time: {this.formatTimeSince(this.state.seconds)}</span>
        );
    }
}

class Game extends React.Component {

    _resetState(width, height, count) {
        // build the board
        const squares = Array(width*height);
        for (let i = 0; i < squares.length; ++i){
            squares[i] = {open: false, flagged: '', value: ''};
        }

        //add mines
        for (let i = 0; i < count; ++i) {
            let position = null;
            while (position == null || squares[position].value) {
                position = Math.floor(Math.random() * squares.length);
            }
            squares[position].value = "💣";
        }

        return {
            width: width,
            height: height,
            count: count,
            squares: squares,
            finished: false,
        }
    }

    setSize(width, height, count) {
        // if one of the params is not specified, it's a custom board.
        // Figure out current difficulty (how common a mine is), so that we can suggest the same rate for the new board
        const oldDifficulty = this.state.count / (this.state.width * this.state.height);
        while (! width) {
            width = parseInt(prompt("Enter board width", this.state.width));
        }
        while (! height) {
            height = parseInt(prompt("Enter board height", this.state.height));
        }
        while (! count) {
            count = parseInt(prompt("Enter number of mines", Math.floor(width * height * oldDifficulty)));
        }

        this.setState(this._resetState(width, height, count));
    }

    constructor(props) {
        super(props);
        this.state = this._resetState(props.width || 10, props.height || 10, props.count || 10);
    }

    handleContextMenu(square, event) {
        if (this.state.finished){
            return;
        }

        const squares = this.state.squares.slice();
        if (squares[square].open) {
            return;
        }
        squares[square].flagged = squares[square].flagged ? '' : '🚩';
        this.setState({
            squares: squares,
        });
        event.preventDefault();
    }

    handleClick(square) {
        if (this.state.finished){
            return;
        }

        const squares = this.state.squares.slice();
        if (squares[square].open) {
            return;
        }

        if (squares[square].flagged) {
            return;
        }

        squares[square].open = true;

        if (squares[square].value) {
            this.setState({finished: 'Mine hit, game lost'});
        } else {
            const topOffset = (square / this.state.width) < 1 ? 0 : -1;
            const bottomOffset = (square / this.state.width) >= this.state.height - 1 ? 0 : 1;
            const leftOffset = (square % this.state.width) < 1 ? 0 : -1;
            const rightOffset = (square % this.state.width) >= this.state.width - 1 ? 0 : 1;

            let adjacent = [];
            for (let x = leftOffset; x <= rightOffset; ++x ){
                for (let y = topOffset; y <= bottomOffset; ++y ){
                    if ( x === 0 && y === 0 ){
                        continue;
                    }
                    adjacent.push(square+x+y*this.state.width);
                }
            }

            let count = 0;
            for (let i = 0; i < adjacent.length; ++i) {
                // if it has a value and isn't yet opened, it's a mine
                if (squares[adjacent[i]].value && ! squares[adjacent[i]].open) {
                    ++count;
                }
            }
            if (count > 0) {
                squares[square].value = count;
            } else {
                // open surrounding squares
                for (let i = 0; i < adjacent.length; ++i) {
                    if (! squares[adjacent[i]].open) {
                        this.handleClick(adjacent[i]);
                    }
                }
            }
            let closedCount = squares.filter(s => ! s.open).length;
            if (closedCount <= this.state.count) {
                this.setState({finished: 'All free squares open, game won!'});
            }
        }
        this.setState({
            squares: squares,
        });
    }

    render() {
        const presetSizes = {
            easy: {width: 10, height: 10, count: 10*10*0.1},
            medium: {width: 20, height: 15, count: 20*15*0.2},
            hard: {width: 30, height: 20, count: 30*20*0.3},
        };
        const resizes = Object.keys(presetSizes).map((name) => {
            const size = presetSizes[name];
            return (
                <div key={name}>
                    <button onClick={() => this.setSize(size.width, size.height, size.count)}>New {name} game</button>
                    <br/>
                    {size.width} x {size.height} with {size.count} mines
                    <br/>
                </div>
            );
        }).concat(
            <div key='custom'>
                <button key='custom' onClick={() => this.setSize()}>New custom game</button>
            </div>
        );

        let status = 'Ready...';
        if (this.state.finished) {
            status = this.state.finished;
        }
        status = <div>
                    {status}<br/>
                    Mines: {this.state.count}<br/>
                    Flags: {this.state.squares.filter(s => s.flagged).length}<br/>
                    Hidden: {this.state.squares.filter(s => ! s.open).length}<br/>
                    <ElapsedTime stopped={this.state.finished} />
                </div>

        return (
            <div className="game">
                <div className="game-info">
                    <div>{status}</div>
                    {resizes}
                </div>
                <div className="game-board">
                <Board
                    squares={this.state.squares}
                    onClick={(i) => this.handleClick(i)}
                    onContextMenu={(i, e) => this.handleContextMenu(i, e)}
                    width={this.state.width}
                    height={this.state.height}
                    count={this.state.count}
                />
                </div>
            </div>
        );
    }
}


// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
