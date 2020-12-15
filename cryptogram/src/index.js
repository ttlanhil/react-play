import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import quotes from './quotes.json';


function getCharCode(character) {
    return character.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
}

function isLetter(charCode) {
    return charCode >= 0 && charCode <= 26;
}

function getRandomItemFromSet(set) {
    let items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}


function LetterDisplay(props) {
    return (
        <span className={props.className}>
            <input
                id={props.id}
                maxLength='1'
                onChange={props.onChange}
                value={props.value}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                onClick={(e) => e.currentTarget.select()}
                disabled={props.disabled ? "disabled" : ""}
            />
        </span>
    );
}

class Puzzle extends React.Component {
    renderLetter(character, i) {
        const charCode = getCharCode(character);
        if (!isLetter(charCode)) {
            return <span key={i} className='spacer'>{character}</span>
        }
        const cyphered = this.props.cypher[charCode]
        const cypheredCharCode = getCharCode(cyphered);
        const charUpper = character.toUpperCase();
        const isHinted = this.props.hints.has(charUpper);
        const disabled = this.props.disabled || isHinted;
        return (
            <LetterDisplay
                key={i}
                id={'input-' + i}
                value={this.props.solveAttempt[cypheredCharCode] || ''}
                className={`inputWrap ${cyphered} ${this.props.focusLetter === cyphered ? 'focus' : ''}`}
                cyphered={cyphered}
                onChange={() => this.props.onChange(i, cyphered)}
                onFocus={() => this.props.onFocus(cyphered)}
                onBlur={() => this.props.onBlur()}
                disabled={disabled}
            />
        );
    }

    renderWord(word, i) {
        return (
            <div key={i} className="nowrap">
                {[...word].map((character, j) => this.renderLetter(character, i+j))}
            </div>
        );
    }

    render() {
        const words = this.props.quote.split(" ");
        let wordOffsets = Array(words.length).fill(0);
        for (let i = 1; i < wordOffsets.length; ++i) {
            wordOffsets[i] = wordOffsets[i-1] + words[i-1].length + 1;
        }
        return (
            <form autoComplete="off">
            {words.map((word, i) => this.renderWord(word, wordOffsets[i]))}
            </form>
        )
    }
}

function sattoloCycle(items, filterReverseSet) {
    // Randomise order of all values, while ensuring they aren't in the same place they started
    let reverseMap = Array(items.length).fill(null);
    for (let i = items.length-1; i > 0; --i) {
        const j = Math.floor(Math.random() * i);
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
    }

    // build reverse mapping; the goal of the player is to match this
    for (let i = 0; i < items.length; ++i) {
        const character = String.fromCharCode(i + 'A'.charCodeAt(0));
        if (filterReverseSet && !filterReverseSet.has(character)) {
            continue;
        }
        reverseMap[getCharCode(items[i])] = character;
    }

    return reverseMap;
}

class Game extends React.Component {
    buildPuzzle(quoteNumber) {
        // select relevant quote
        const quote = quotes[quoteNumber];
        // build a cypher for the letters A-Z
        let cypher = [...Array(26)].map((_, i) => String.fromCharCode('A'.charCodeAt(0) + i));
        const lettersInUse = new Set(quote.Quote.toUpperCase().split("").filter(x => !isLetter(x)));
        const goal = sattoloCycle(cypher, lettersInUse);
        return {
            quoteNumber: quoteNumber,
            quote: quote,
            cypher: cypher,
            goal: goal,
            solveAttempt: Array(26).fill(null),
            focusLetter: '',
            finished: false,
            hints: new Set(),
            lettersInUse: lettersInUse,
        }
    }

    constructor(props) {
        super(props);
        const quoteNumber = 0;
        // TODO: store progress in cookie?
        this.state = this.buildPuzzle(quoteNumber);
    }

    changePuzzle(quoteNumber) {
        this.setState(this.buildPuzzle(quoteNumber));
    }

    checkPuzzle(solveAttempt) {
        // TODO: mark where same letter used multiple times?
        for (let i = 0; i < solveAttempt.length; ++i) {
            if (solveAttempt[i] !== this.state.goal[i] ){
                return false;
            }
        }
        this.setState({finished: true});
        return true;
    }

    handleChange(i, cyphered) {
        const letter = document.getElementById("input-"+i).value;
        const solveAttempt = this.state.solveAttempt.slice();
        solveAttempt[getCharCode(cyphered)] = letter.toUpperCase();
        if (!this.checkPuzzle(solveAttempt)){
            // Walk forward in the puzzle to find the next input that's empty, and select that.
            // if we hit the end, loop back to the start
            for (let j = 1; j < this.state.quote.Quote.length; ++j) {
                const idx = (j + i) % this.state.quote.Quote.length;
                const character = this.state.quote.Quote[idx].toUpperCase();
                const charCode = getCharCode(character);
                if (!isLetter(charCode)) {
                    continue;
                }
                const cypheredCharCode = getCharCode(this.state.cypher[charCode]);
                if (!solveAttempt[cypheredCharCode]){
                    const elem = document.getElementById("input-"+idx);
                    if (elem) {
                        elem.focus();
                    }
                    break;
                }
            }
        }
        this.setState({solveAttempt: solveAttempt});
    }

    handleFocus(letter) {
        this.setState({focusLetter: letter});
    }

    handleBlur() {
        this.setState({focusLetter: ''});
    }

    getHint() {
        // take a random entry from lettersInUse that's not yet in hints, and add it
        let hints = this.state.hints;
        if (hints.size >= this.state.lettersInUse.length) {
            // if every letter is a hint, why are you asking for more?
            return;
        }
        let incorrect = new Set();
        let empty = new Set();

        for (let i = 0; i < this.state.solveAttempt.length; ++i) {
            if (!this.state.goal[i]) {
                continue;
            }
            if (!this.state.solveAttempt[i]) {
                empty.add(i)
            } else if (this.state.solveAttempt[i] !== this.state.goal[i]) {
                incorrect.add(i);
            }
        }

        let newHint = incorrect.size > 0 ? getRandomItemFromSet(incorrect) : getRandomItemFromSet(empty);

        const solveAttempt = this.state.solveAttempt.slice();
        solveAttempt[newHint] = this.state.goal[newHint];
        newHint = this.state.goal[newHint];
        hints.add(newHint);

        this.checkPuzzle(solveAttempt);

        this.setState({
            hints: hints,
            solveAttempt: solveAttempt,
        });
    }

    render() {

        let navButtons = [];
        if (this.state.quoteNumber > 0) {
            navButtons.push(<button key='prev' onClick={() => this.changePuzzle(this.state.quoteNumber-1)}>Previous</button>);
        }

        navButtons.push(<button key='hint' onClick={() => this.getHint()}>Hint</button>);

        if (this.state.quoteNumber < quotes.length - 1) {
            navButtons.push(<button key='next' onClick={() => this.changePuzzle(this.state.quoteNumber+1)}>Next</button>);
        }

        let status;
        if (this.state.finished) {
            status = "Game solved!"
        } else {
            status = `Playing game ${this.state.quoteNumber+1} of ${quotes.length}`;
        }

        return (
            <div>
                <div className="gameStatus">
                    {navButtons}
                    <br />
                    {status}
                </div>
                <div>
                    <Puzzle
                        quote={this.state.quote.Quote}
                        cypher={this.state.cypher}
                        solveAttempt={this.state.solveAttempt}
                        focusLetter={this.state.focusLetter}
                        hints={this.state.hints}
                        onChange={(i, cyphered) => this.handleChange(i, cyphered)}
                        onFocus={(letter) => this.handleFocus(letter)}
                        onBlur={() => this.handleBlur()}
                        disabled={this.state.finished}
                    />
                </div>
                <div>
                    - {this.state.quote.Author}
                </div>
            </div>
        );
    }
}


// display element
ReactDOM.render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
  document.getElementById('root')
);
