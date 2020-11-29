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
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(props.width*props.width).fill(null)
            }],
            stepNumber: 0,
            xIsNext: true,
        };
    }

    calculateWinner() {
        const width = this.props.width;
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
                squares: squares
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

        const moves = history.map((step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';
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
            <div className="game">
                <div className="game-board">
                <Board
                    squares={current.squares}
                    winningSquares={winningSquares || []}
                    onClick={(i) => this.handleClick(i)}
                    width={this.props.width}
                />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{moves}</ol>
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
