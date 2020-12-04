import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
    return (
        <button className={"square" + (props.winningSquare ? ' winning' : '')} onClick={props.onClick}>
            {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
                key={i}
                value={this.props.squares[i]}
                winningSquare={this.props.winningSquares.includes(i)}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    render() {
        const width = this.props.width;
        return (
            <div>
                {[...Array(width)].map((_, x) =>
                    <div className="board-row" key={"row_"+x}>
                    {[...Array(width)].map(
                        (_, y) => {return this.renderSquare(x * this.props.width + y)}
                    )}
                    </div>
                )}
            </div>
        );
    }
}

class Game extends React.Component {

    _resetState(width) {
        return {
            history: [{
                squares: Array(width*width).fill(null)
            }],
            stepNumber: 0,
            xIsNext: true,
            width: width
        }
    }

    setWidth(width) {
        this.setState(this._resetState(width));
    }

    constructor(props) {
        super(props);
        this.state = this._resetState(props.width || 3);
    }

    calculateWinner() {
        const width = this.state.width;
        const history = this.state.history;
        const squares = history[this.state.stepNumber].squares;

        const lines = [
            // horizontal
            [...Array(width)].map((_, i) => [...Array(width)].map((_, j) => i*width+j)),
            // vertical
            [...Array(width)].map((_, i) => [...Array(width)].map((_, j) => i+j*width)),
            // diagonal from 0
            [[...Array(width)].map((_, i) => i+i*width)],
            // diagonal perpendicular
            [[...Array(width)].map((_, i) => (width-1-i)+i*width)],
        ].flat();

        for (let i = 0; i < lines.length; i++) {
            // map from square indexes to current values
            const entries = lines[i].map(j => squares[j]);
            // if filled in and all the same
            if ( entries[0] && entries.every(j => j === entries[0]) ){
                return {winningPlayer: entries[0], winningSquares: lines[i]};
            }
        }
        return {};
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (this.calculateWinner().winningPlayer || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares: squares,
                lastMove: i,
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const {winningPlayer, winningSquares} = this.calculateWinner();

        const resizes = [2, 3, 4, 5, 6].map((size) => {
            return (
                <li key={size}>
                    <button onClick={() => this.setWidth(size)}>New {size} x {size}</button>
                </li>
            );
        });

        const moves = history.map((step, move) => {
            let desc = 'Go back to start of game';
            if (move > 0){
                let x = Math.floor(history[move].lastMove / this.state.width);
                let y = history[move].lastMove % this.state.width;
                let player = (move % 2) === 0 ? 'O' : 'X';  // different order because it's for current player, not next player as in other places
                desc = `Go to move #${move} (${x},${y} = ${player})`;
            }

            return (
                <li key={move} style={move === this.state.stepNumber ? {fontWeight:"bold"} : {}}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });

        let status;
        if (winningPlayer){
            status = 'Winner: ' + winningPlayer;
        } else if (this.state.stepNumber >= current.squares.length) {
            status = 'Draw!';
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }

        return (
            <div>
                <div>
                    tic tac toe game based on React tutorial: <a href="https://reactjs.org/tutorial/tutorial.html">https://reactjs.org/tutorial/tutorial.html</a>
                    <br/>
                    Includes each of the additional tasks, as well as allowing multiple board sizes
                </div>
                <br/>
                <div className="game">
                    <div className="game-info">
                        <div>{status}</div>
                        <ul>{resizes}</ul>
                        <ol>{moves}</ol>
                    </div>
                    <div className="game-board">
                    <Board
                        squares={current.squares}
                        winningSquares={winningSquares || []}
                        onClick={(i) => this.handleClick(i)}
                        width={this.state.width}
                    />
                    </div>
                </div>
            </div>
        );
    }
}


// ========================================

ReactDOM.render(
    <Game width={3} />,
    document.getElementById('root')
);
