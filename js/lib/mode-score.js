
define("ace/mode/score",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/text_highlight_rules","ace/tokenizer","ace/range","ace/mode/folding/fold_mode"],
    function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");

// defines the parent mode
var TextMode = require("./text").Mode;
var Tokenizer = require("../tokenizer").Tokenizer;

// defines the language specific highlighters and folding rules
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;


var MyNewHighlightRules = function() {

    var keywordMapper = this.createKeywordMapper({
        "variable.language": "this",
        "keyword": 
            " A B C E E F G" +
            " EQ NE LT LE GT GE NOT AND OR XOR IN LIKE BETWEEN",
        "constant.language": 
            "TRUE FALSE NULL SPACE",
        "support.type": 
            "n i p ii iii string xstring decfloat16 decfloat34",
        "keyword.operator":
            "abs sign ceil floor trunc frac acos asin atan cos sin tan" +
            " abapOperator cosh sinh tanh exp log log10 sqrt" +
            " strlen xstrlen charlen numofchar dbmaxlen lines" 
    }, "text", true, " ");

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used
   this.$rules = {
        "start" : [ 
            { token : "text", regex : "<\\!\\[CDATA\\[", next : "cdata"} ,
            {token : "string", regex : "`", next  : "string"},
            {token : "string", regex : "'", next  : "qstring"},
            {token : "variable.parameter", regex : /\w+-\w+(?:-\w+)*/},
            {token : "comment",  regex : /".+$/},
            {token : "keyword", regex : /:i*[+-]*|[ABCDEFG][#b]?/},
            {token : "keyword.operator", regex: /\W[\-+\%=<>*]\W|\*\*|[~:,\.&$]|->*?|=>/},
            {token : "paren.lparen", regex : "[\\[({]"},
            {token : "paren.rparen", regex : "[\\])}]"},
            {token : "constant.numeric", regex: "[+-]?\\d+\\b"},
            {token : keywordMapper, regex : "\\b\\w+\\b"},
            {caseInsensitive: false}
        ],

        "qstring" : [
            {token : "constant.language.escape",   regex : "''"},
            {token : "string", regex : "'",     next  : "start"},
            {defaultToken : "string"}
        ],

        "string": [
            {token : "constant.language.escape",   regex : "``"},
            {token : "string", regex : "`",     next  : "start"},
            {defaultToken : "string"}
        ]
    };
};
oop.inherits(MyNewHighlightRules, TextHighlightRules);

var Range = require("../range").Range;
var BaseFoldMode = require("./folding/fold_mode").FoldMode;
var MyNewFoldMode = exports.FoldMode = function() {};
oop.inherits(MyNewFoldMode, BaseFoldMode);

(function() {

    // regular expressions that identify starting and stopping points
    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var line = session.getLine(row);

        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);

            var range = session.getCommentFoldRange(row, i + match[0].length);
            range.end.column -= 2;
            return range;
        }

        // test each line, and return a range of segments to collapse
    };

}).call(MyNewFoldMode.prototype);



var MatchingBraceOutdent = function() {};

(function() {

    this.checkOutdent = function(line, input) {
        if (! /^\s+$/.test(line))
            return false;

        return /^\s*\}/.test(input);
    };

    this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);
    };

    this.$getIndent = function(line) {
        return line.match(/^\s*/)[0];
    };

}).call(MatchingBraceOutdent.prototype);
 
var Mode = function() {
    // set everything up
    this.HighlightRules = MyNewHighlightRules;
    this.$outdent = new MatchingBraceOutdent();
    this.foldingRules = new MyNewFoldMode();
};
oop.inherits(Mode, TextMode);

(function() {
    // configure comment start/end characters
    this.lineCommentStart = "//";
    this.blockComment = {start: "/*", end: "*/"};
    
    // special logic for indent/outdent. 
    // By default ace keeps indentation of previous line
    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);
        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };
    
    // create worker for live syntax checking
    /*
    this.createWorker = function(session) {
        console.log('mode');
        var worker = new WorkerClient(["ace"], "ace/mode/mynew_worker", "NewWorker");
        worker.attachToDocument(session.getDocument());
        worker.on("errors", function(e) {
            session.setAnnotations(e.data);
        });
        return worker;
    };
    */
    
    
}).call(Mode.prototype);

exports.Mode = Mode;
});