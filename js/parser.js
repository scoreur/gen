/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var score_parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,18],$V1=[1,19],$V2=[1,16],$V3=[1,17],$V4=[1,14],$V5=[1,4,11,12,20,21,42],$V6=[1,24],$V7=[1,25],$V8=[1,26],$V9=[4,14,15,16],$Va=[1,36],$Vb=[1,37],$Vc=[1,38],$Vd=[1,39],$Ve=[1,40],$Vf=[1,41],$Vg=[1,42],$Vh=[4,11,12,14,15,16,46],$Vi=[4,14,15,16,23,25,27,29,34,35,36,37,38,39,40],$Vj=[11,12,34,35,36,37,38,39,40,44],$Vk=[4,11,12,14,15,16,34,35,36,37,38,39,40,46],$Vl=[4,11,12,14,15,16,23,24,25,27,29,34,35,36,37,38,39,40,46,47],$Vm=[4,11,12,14,15,16,23,25,27,29,34,35,36,37,38,39,40,44,46];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"e":3,"EOF":4,"M":5,"Measure":6,"melody":7,"harmony":8,"percussion":9,"NUMBER":10,"DIGIT":11,"DIGITS":12,"M_end":13,"M_SEP":14,"BAR":15,"REPEAT_END":16,"Note":17,"Ctrl":18,"C0":19,"CTRL_START":20,"REPEAT_START":21,"C1":22,"t":23,"/":24,"k":25,"KEY":26,"Op_string":27,"STRING":28,"Op_unary":29,"P1":30,"C":31,"Chord":32,"P":33,"#":34,"FLAT":35,"+":36,"-":37,"NATURAL":38,"TRILL_UP":39,"TRILL_DOWN":40,"Pitches":41,"CHORD_START":42,"Inverse":43,"i":44,"DUR":45,",":46,"^":47,"$accept":0,"$end":1},
terminals_: {2:"error",4:"EOF",7:"melody",8:"harmony",9:"percussion",11:"DIGIT",12:"DIGITS",14:"M_SEP",15:"BAR",16:"REPEAT_END",20:"CTRL_START",21:"REPEAT_START",23:"t",24:"/",25:"k",26:"KEY",27:"Op_string",28:"STRING",29:"Op_unary",34:"#",35:"FLAT",36:"+",37:"-",38:"NATURAL",39:"TRILL_UP",40:"TRILL_DOWN",42:"CHORD_START",44:"i",46:",",47:"^"},
productions_: [0,[3,2],[3,3],[3,2],[3,1],[3,1],[3,1],[3,1],[10,1],[10,1],[6,2],[6,3],[13,1],[13,1],[5,1],[5,1],[5,3],[5,3],[19,1],[19,1],[22,4],[22,2],[22,2],[22,2],[22,1],[31,1],[31,2],[18,1],[18,1],[33,1],[33,2],[30,1],[30,1],[30,1],[30,1],[30,1],[30,1],[30,1],[41,1],[41,2],[32,3],[43,2],[43,2],[43,0],[17,2],[45,2],[45,3],[45,2],[45,0]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

    this.$ = $$[$0-1];
    return this.$;
  
break;
case 2:

    $$[$0-1].push({
      ctrl: 'normal_end'
    });
    $$[$0-2].data.push($$[$0-1]);
    this.$ = $$[$0-2];
    return this.$;
  
break;
case 3:

    /* push new measure */
    $$[$0-1].data.push($$[$0])
    this.$ = $$[$0-1]
  
break;
case 4:

    /* default as melody */
    this.$ = {
      mode:'melody',
      data: [$$[$0]]
      };
  
break;
case 5:

    /* create new track*/
    this.$ = {mode:'melody'};
  
break;
case 6:

    this.$ = {mode:'harmony'};
  
break;
case 7:

    this.$ = {mode:'percussion'};
  
break;
case 8:

    this.$ = parseInt($$[$0]);
  
break;
case 9:
 /* remove brackets */
    this.$ = parseInt($$[$0].substr(1,$$[$0].length-2));
    console.log('braket number', this.$);
  
break;
case 10: case 39:

    $$[$0-1].push($$[$0]);
    this.$ = $$[$0-1];
  
break;
case 11: case 16: case 17:

    $$[$0-2].push($$[$0]);
    this.$ = $$[$0-2];
  
break;
case 12:

    this.$ = {
      ctrl: 'normal_end'
    };
  
break;
case 13:

    this.$ = {
      ctrl: 'repeat_end'
    };
  
break;
case 14: case 15: case 38:

    this.$ = [$$[$0]];
  
break;
case 18:

    this.$ = ['ctrl', 'reset'];
  
break;
case 19:

    this.$ = ['ctrl', 'repeat_start'];
  
break;
case 20:

    this.$ = [$$[$0-3], [$$[$0-2], $$[$0]]];
  
break;
case 21:

    this.$ = [$$[$0-1], $$[$0]];
  
break;
case 22:

    this.$ = [$$[$0-1], $$[$0].substr(1, $$[$0].length-2)];
  
break;
case 23:

    this.$ = [$$[$0-1][0], $$[$0]];
  
break;
case 24:

    this.$ = ['p', $$[$0]];
  
break;
case 25:

    this.$ = {};
    this.$[$$[$0][0]] = $$[$0][1];
  
break;
case 26:

    $$[$0-1][$$[$0][0]] = $$[$0][1];
    if($$[$0-1].ctrl == 'reset'){
      $$[$0-1].ctrl = 'normal';
    }
    this.$ = $$[$0-1];
  
break;
case 27: case 28: case 29:

    this.$ = $$[$0];
  
break;
case 30:

    if(typeof $$[$0-1] == 'number'){
      $$[$0-1] = {
        original: $$[$0-1],
        ornament: [$$[$0]]
      };
    }else{
      $$[$0-1].ornament.push($$[$0]);
    }
    this.$ = $$[$0-1]
  
break;
case 31:

    this.$ = 1;
  
break;
case 32:

    this.$ = -1;
  
break;
case 33:

    this.$ = 12;
  
break;
case 34:

    this.$ = -12;
  
break;
case 35:

    this.$ = 0;
  
break;
case 36:

    this.$ = 'trill_up'
  
break;
case 37:

    this.$ = 'trill_down'
  
break;
case 40:

    this.$ = {};
    this.$.ctrl = 'chord';
    this.$.transpose = $$[$0-1].transpose;
    this.$.inv = $$[$0-1].inv;
    this.$.pitch = $$[$0];
  
break;
case 41:

    $$[$0-1].inv += 1;
    this.$ = $$[$0-1];
  
break;
case 42:

    if(typeof $$[$0] == 'number'){
      $$[$0-1].transpose += $$[$0];
    }else{
      // other ornament
    }

    this.$ = $$[$0-1];
  
break;
case 43:

    this.$ = {inv: 0, transpose: 0};
  
break;
case 44:

    this.$ = {
      pitch:$$[$0-1],
      dur: $$[$0]
      };
  
break;
case 45:

    this.$ = $$[$0];

  
break;
case 46:

    this.$ = {
      original: $$[$0-1],
      ornament: 'tie'
    	}
  
break;
case 47:

    this.$ = {
      original: 1,
      ornament: 'tie'
    }
  
break;
case 48:
 this.$ = 1
break;
}
},
table: [{3:1,5:6,6:2,7:[1,3],8:[1,4],9:[1,5],10:15,11:$V0,12:$V1,17:7,18:8,19:13,20:$V2,21:$V3,31:10,32:11,33:12,41:9,42:$V4},{1:[3],4:[1,20],5:21,6:22,10:15,11:$V0,12:$V1,17:7,18:8,19:13,20:$V2,21:$V3,31:10,32:11,33:12,41:9,42:$V4},o($V5,[2,4]),o($V5,[2,5]),o($V5,[2,6]),o($V5,[2,7]),{13:23,14:$V6,15:$V7,16:$V8},o($V9,[2,14]),o($V9,[2,15]),o($V9,[2,48],{10:15,45:27,33:28,11:$V0,12:$V1,46:[1,29]}),o($V9,[2,27],{22:30,30:35,23:[1,31],25:[1,32],27:[1,33],29:[1,34],34:$Va,35:$Vb,36:$Vc,37:$Vd,38:$Ve,39:$Vf,40:$Vg}),o($V9,[2,28]),o($Vh,[2,38],{30:43,34:$Va,35:$Vb,36:$Vc,37:$Vd,38:$Ve,39:$Vf,40:$Vg}),o($Vi,[2,25]),o($Vj,[2,43],{43:44}),o($Vk,[2,29]),o($Vi,[2,18]),o($Vi,[2,19]),o($Vl,[2,8]),o($Vl,[2,9]),o($V5,[2,1]),{4:[1,45],13:23,14:$V6,15:$V7,16:$V8},o($V5,[2,3]),o($V5,[2,10]),{10:15,11:$V0,12:$V1,13:46,15:$V7,16:$V8,17:47,18:48,19:13,20:$V2,21:$V3,31:10,32:11,33:12,41:9,42:$V4},o($V5,[2,12]),o($V5,[2,13]),o($V9,[2,44]),o($Vh,[2,39],{30:43,34:$Va,35:$Vb,36:$Vc,37:$Vd,38:$Ve,39:$Vf,40:$Vg}),{10:49,11:$V0,12:$V1,47:[1,50]},o($Vi,[2,26]),{10:51,11:$V0,12:$V1},{26:[1,52]},{28:[1,53]},{10:54,11:$V0,12:$V1},o($Vi,[2,24]),o($Vm,[2,31]),o($Vm,[2,32]),o($Vm,[2,33]),o($Vm,[2,34]),o($Vm,[2,35]),o($Vm,[2,36]),o($Vm,[2,37]),o($Vk,[2,30]),{10:15,11:$V0,12:$V1,30:57,33:12,34:$Va,35:$Vb,36:$Vc,37:$Vd,38:$Ve,39:$Vf,40:$Vg,41:55,44:[1,56]},o($V5,[2,2]),o($V5,[2,11]),o($V9,[2,16]),o($V9,[2,17]),o($V9,[2,45],{47:[1,58]}),o($V9,[2,47]),{24:[1,59]},o($Vi,[2,21]),o($Vi,[2,22]),o($Vi,[2,23]),o($V9,[2,40],{10:15,33:28,11:$V0,12:$V1}),o($Vj,[2,41]),o($Vj,[2,42]),o($V9,[2,46]),{10:60,11:$V0,12:$V1},o($Vi,[2,20])],
defaultActions: {},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

	
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return yy_.yytext;
break;
case 1:this.begin('NOTE'); return 11;
break;
case 2:this.begin('INITIAL'); return 15;
break;
case 3:this.begin('CTRL'); return 21;
break;
case 4:this.begin('INITIAL'); return 15;
break;
case 5:this.begin('INITIAL'); return 16;
break;
case 6:this.begin('CTRL'); return 20;
break;
case 7:this.begin('CHORD'); return 42;
break;
case 8:return 26;
break;
case 9:this.begin('NOTE'); return 14;
break;
case 10:/* skip */
break;
case 11:/* skip */
break;
case 12:return yy_.yytext[0];
break;
case 13:return 29;
break;
case 14:return 27;
break;
case 15:return 11;
break;
case 16:return 28;
break;
case 17:return 44;
break;
case 18:return 11;
break;
case 19:return 12;
break;
case 20:this.begin('NOTE_DUR'); return 46;
break;
case 21:return 38;
break;
case 22:return 35;
break;
case 23:return 40;
break;
case 24:return 39;
break;
case 25:return yy_.yytext;
break;
case 26:return 4;
break;
case 27:console.log('Unrecognized token: ', yy_.yytext);
break;
}
},
rules: [/^(?:((melody|harmony|percussion)))/,/^(?:(([0-9])))/,/^(?:((\r|\n|\r\n)))/,/^(?:\|:)/,/^(?:\|)/,/^(?::\|)/,/^(?::)/,/^(?:@)/,/^(?:(([A-GR][#b]{0,2})))/,/^(?:(([ |\t|\f|\v]))+)/,/^(?:\s+)/,/^(?:((%[^\r\n]*((\r|\n|\r\n)))))/,/^(?:((key_sig|time_sig|instrument|[k|t|i])))/,/^(?:((rate|volume|ctrls|[r|c|v])))/,/^(?:((out|scale|[o|s])))/,/^(?:(([0-9]))+)/,/^(?:\{[a-z_]+\})/,/^(?:[i])/,/^(?:(([0-9])))/,/^(?:\{(([0-9]))+\})/,/^(?:,)/,/^(?:[n])/,/^(?:[b])/,/^(?:~!)/,/^(?:~)/,/^(?:((,|;|\{|\}|\+|-|#|\/|\^)))/,/^(?:$)/,/^(?:.)/],
conditions: {"CTRL":{"rules":[2,3,4,5,6,7,8,9,12,13,14,15,16,25,26,27],"inclusive":true},"NOTE":{"rules":[2,3,4,5,6,7,8,9,18,19,20,21,22,23,24,25,26,27],"inclusive":true},"NOTE_DUR":{"rules":[2,3,4,5,6,7,8,9,15,25,26,27],"inclusive":true},"CHORD":{"rules":[3,4,5,6,7,8,9,17,18,25,26,27],"inclusive":true},"INITIAL":{"rules":[0,1,3,4,5,6,7,8,10,11,19,25,26,27],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = score_parser;
exports.Parser = score_parser.Parser;
exports.parse = function () { return score_parser.parse.apply(score_parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}