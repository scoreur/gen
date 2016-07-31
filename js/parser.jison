%{
  if(typeof MG == 'undefined' && typeof module !== 'undefined' && typeof require !== 'undefined'){
    MG = require("../coffee/musical");
    console.log('MG loaded');
  }
  var MG = MG || {};
  var scope = {
    key_sig: 'C',
    time_sig: [4,4],
    tempo: 120,
    ctrl_per_beat: 4
  }
	
%}

%lex
DIGIT		=	([0-9])
SIMPLE		=	(","|";"|"{"|"}"|"+"|"-"|"#"|"/"|"^"	)
NEWLINE		=	(\r|\n|\r\n)
SPACE		=	([ |\t|\f|\v])
COMMENT		=	("%"[^\r\n]*{NEWLINE})
KEY 		=	([A-GR][#b]{0,2})
Op_unary	=	("rate"|"volume"|"ctrls"|[r|c|v])
Op			=	("key_sig"|"time_sig"|"scale"|[k|t|s])
MODE 		=	("melody"|"harmony")

%s CTRL NOTE NOTE_DUR

%%

<INITIAL>{MODE}					{return yytext;}
<INITIAL>{DIGIT}+				{this.begin('NOTE'); return 'DIGIT';}
<NOTE,NOTE_DUR,CTRL>{NEWLINE}	{this.begin('INITIAL'); return 'BAR';}
"|:"							{this.begin('CTRL'); return 'REPEAT_START';}
"|"								{this.begin('INITIAL'); return 'BAR';}
":|"							{this.begin('INITIAL'); return 'REPEAT_END';}

":"								{this.begin('CTRL'); return 'CTRL_START';}

{KEY}							{return 'KEY';}

<INITIAL>\s+					/* skip */
<INITIAL>{COMMENT}				/* skip */


/* Control */

<CTRL>{Op}						{return yytext[0];}
<CTRL>{Op_unary}				{return 'Op_unary';}
<CTRL>{SPACE}+					{this.begin('NOTE'); return 'M_SEP';}
<CTRL,NOTE_DUR>{DIGIT}+			{return 'DIGIT';}
<CTRL>"{"[a-z_]+"}"				{return 'STRING';}


/* Note */

<NOTE,NOTE_DUR>{SPACE}+			{this.begin('NOTE'); return 'M_SEP';}
<NOTE>{DIGIT}					{return 'DIGIT';}
<NOTE>"{"{DIGIT}+"}"			{return 'DIGITS';}
<NOTE>","						{this.begin('NOTE_DUR'); return ',';}
<NOTE>[n]						return 'NATURAL'
<NOTE>[b]						return 'FLAT'

{SIMPLE}						{return yytext;}
<<EOF>>							{return 'EOF';}
.								{console.log('Unrecognized token: ', yytext);}


/lex

%start e

%%

e :
  e EOF
  {
    $$ = $1;
    return $$;
  }
  | e M EOF
  {
    $2.push({
      ctrl: 'normal_end'
    });
    $1.data.push($2);
    $$ = $1;
    return $$;
  }
  | e Measure
  {
    /* push new measure */
    $1.data.push($2)
    $$ = $1
  }
  | Measure
  {
    /* default as melody */
    $$ = {
      mode:'melody',
      data: [$1]
      };
  }
  | melody
  {
    /* create new track*/
    $$ = {mode:'melody'};
  }
  | harmony
  {
    $$ = {mode:'harmony'};
  }
  ;

NUMBER:
  DIGIT
  {
    $$ = parseInt($1);
  }
  | DIGITS
  { /* remove brackets */
    $$ = parseInt($1.substr(1,$1.length-2));
    console.log('braket number', $$);
  }
  ;


/* measure */
Measure :
  M M_end
  {
    $1.push($2);
    $$ = $1;
  }
  | M M_SEP M_end
  {
    $1.push($3);
    $$ = $1;
  }
  ;

M_end :
  BAR
  {
    $$ = {
      ctrl: 'normal_end'
    };
  }
  | REPEAT_END
  {
    $$ = {
      ctrl: 'repeat_end'
    };
  }
  ;

M :
  Note
  {
    $$ = [$1];
  }
  | Ctrl
  {
    $$ = [$1];
  }
  | M M_SEP Note
  {
    $1.push($3);
    $$ = $1;
  }
  | M M_SEP Ctrl
  {
    $1.push($3);
    $$ = $1;
  }
  ;

/* control */
C0 :
  CTRL_START
  {
    $$ = ['ctrl', 'reset'];
  }
  | REPEAT_START
  {
    $$ = ['ctrl', 'repeat_start'];
  }
  ;

C1 :
  't' NUMBER '/' NUMBER
  {
    $$ = [$1, [$2, $4]];
  }
  | 'k' KEY
  {
    $$ = [$1, $2];
  }
  | 's' STRING
  {
    $$ = [$1, $2.substr(1, $2.length-2)];
  }
  | Op_unary NUMBER
  {
    $$ = [$1[0], $2];
  }
  | P1
  {
    $$ = ['p', $1];
  }
  ;

C :
  C0
  {
    $$ = {};
    $$[$1[0]] = $1[1];
  }
  | C C1
  {
    $1[$2[0]] = $2[1];
    if($1.ctrl == 'reset'){
      $1.ctrl = 'normal';
    }
    $$ = $1;
  }
  ;  


Ctrl :
  C
  {
    $$ = $1;
  }
  ;  


/* notes */
P :
  NUMBER
  {
    $$ = $1;
  }
  | P P1
  {
    if(typeof $1 == 'number'){
      $1 = {
        original: $1,
        ornament: [$2]
      };
    }else{
      $1.ornament.push($2);
    }
    $$ = $1
  }
  ;

P1 :
  '#'
  {
    $$ = 1;
  }
  | FLAT
  {
    $$ = -1;
  }
  | '+'
  {
    $$ = 12;
  }
  | '-'
  {
    $$ = -12;
  }
  | NATURAL
  {
    $$ = 0;
  }
  ;  

Pitches :
  P
  {
    $$ = [$1];
  }
  | Pitches P
  {
    $1.push($2);
    $$ = $1;
  }
  ;

Note :
  Pitches DUR
  {
    $$ = {
      pitch:$1,
      dur: $2
      };
  }
  ;

DUR :
  ',' NUMBER
  {
    $$ = $2;

  }
  | ',' NUMBER '^'
  {
    $$ = {
      original: $2,
      ornament: 'tie'
    	}
  }
  |
  { $$ = 1}
  ;
