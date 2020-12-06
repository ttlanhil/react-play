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
                disabled={this.props.disabled}
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
            <div>
            {words.map((word, i) => this.renderWord(word, wordOffsets[i]))}
            </div>
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
        if (!filterReverseSet.has(character)) {
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
        const goal = sattoloCycle(cypher, new Set(quote.Quote));
        return {
            quoteNumber: quoteNumber,
            quote: quote,
            cypher: cypher,
            goal: goal,
            solveAttempt: Array(26).fill(null),
            focusLetter: '',
            finished: false,
        }
    }

    constructor(props) {
        super(props);
        const quoteNumber = 0;
        // TODO: store progress in cookie?
        this.state = this.buildPuzzle(quoteNumber);
    }

    checkPuzzle(solveAttempt) {
        // TODO: mark where same letter used multiple times?
        for (let i = 0; i < solveAttempt.length; ++i) {
            if (solveAttempt[i] !== this.state.goal[i] ){
                return false;
            }
        }
        return true;
    }

    handleChange(i, cyphered) {
        const letter = document.getElementById("input-"+i).value;
        const solveAttempt = this.state.solveAttempt.slice();
        solveAttempt[getCharCode(cyphered)] = letter.toUpperCase();
        if (this.checkPuzzle(solveAttempt)){
            this.setState({finished: true});
        } else {
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

    render() {

        let status = this.state.finished ? "Game solved!" : `Playing game ${this.state.quoteNumber+1} of ${quotes.length}`;
        // TODO: allow going to prev/next puzzles

        return (
            <div>
                <div>
                    {status}
                </div>
                <div>
                    <Puzzle
                        quote={this.state.quote.Quote}
                        cypher={this.state.cypher}
                        solveAttempt={this.state.solveAttempt}
                        focusLetter={this.state.focusLetter}
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
