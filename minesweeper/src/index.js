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
                // only show value once opened
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
            squares[position].value = "X";
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
        this.setState(this._resetState(width, height, count));
    }

    constructor(props) {
        super(props);
        this.state = this._resetState(props.width || 10, props.height || 5, props.count || 5);
    }

    handleContextMenu(square, event) {
        if (this.state.finished){
            return;
        }

        const squares = this.state.squares.slice();
        if (squares[square].open) {
            return;
        }
        squares[square].flagged = squares[square].flagged ? '' : '!';
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

        if (squares[square].value === 'X') {
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
                if (squares[adjacent[i]].value === 'X') {
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
                <li key={size}>
                    <button onClick={() => this.setSize(size.width, size.height, size.count)}>New {name} game</button>  ({size.width} x {size.height} with {size.count} mines)
                </li>
            );
        });

        let status = 'Waiting on player';
        if (this.state.finished) {
            status = this.state.finished;
        }

        return (
            <div className="game">
                <div className="game-info">
                    <div>{status}</div>
                    <ul>{resizes}</ul>
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
