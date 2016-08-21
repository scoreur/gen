%{
	
%}

%lex
DIGIT           =	([0-9])
SIMPLE          =	(","|";"|"{"|"}"|"+"|"-"|"#"|"/"|"^")
NEWLINE         =	(\r|\n|\r\n)
SPACE           =	([ |\t|\f|\v])
COMMENT         =	("%"[^\r\n]*{NEWLINE})
KEY             =	([A-GR][#b]{0,2})
Op_unary        =	("rate"|"volume"|"ctrls"|[r|c|v])
Op_string       =   ("out"|"scale"|[o|s])
Op              =	("key_sig"|"time_sig"|"instrument"|[k|t|i])
MODE            =	("melody"|"harmony"|"percussion")

%s CTRL NOTE NOTE_DUR CHORD

%%

<INITIAL>{MODE}                         {return yytext;}
<INITIAL>{DIGIT}                        {this.begin('NOTE'); return 'DIGIT';}
<NOTE,NOTE_DUR,CTRL>{NEWLINE}           {this.begin('INITIAL'); return 'BAR';}
"|:"							        {this.begin('CTRL'); return 'REPEAT_START';}
"|"								        {this.begin('INITIAL'); return 'BAR';}
":|"						        	{this.begin('INITIAL'); return 'REPEAT_END';}

":"						           		{this.begin('CTRL'); return 'CTRL_START';}
"@"                                     {this.begin('CHORD'); return 'CHORD_START';}

{KEY}				        			{return 'KEY';}
<CTRL,CHORD,NOTE,NOTE_DUR>{SPACE}+		{this.begin('NOTE'); return 'M_SEP';}
<INITIAL>\s+			        		/* skip */
<INITIAL>{COMMENT}		        		/* skip */


/* Control */

<CTRL>{Op}					       	    {return yytext[0];}
<CTRL>{Op_unary}                        {return 'Op_unary';}
<CTRL>{Op_string}                       {return 'Op_string';}
<CTRL,NOTE_DUR>{DIGIT}+		        	{return 'DIGIT';}
<CTRL>"{"[a-z_]+"}"			        	{return 'STRING';}

<CHORD>[i]                              {return 'i';}


/* Note */


<NOTE,CHORD>{DIGIT}				        {return 'DIGIT';}
<NOTE,INITIAL>"{"{DIGIT}+"}"		        	{return 'DIGITS';}
<NOTE>","					        	{this.begin('NOTE_DUR'); return ',';}
<NOTE>[n]				        		{return 'NATURAL';}
<NOTE>[b]				        		{return 'FLAT';}
<NOTE>"~!"                              {return 'TRILL_DOWN';}
<NOTE>"~"                               {return 'TRILL_UP';}

{SIMPLE}		        				{return yytext;}
<<EOF>>				        			{return 'EOF';}
.					        			{console.log('Unrecognized token: ', yytext);}


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
  | percussion
  {
    $$ = {mode:'percussion'};
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
  | Op_string STRING
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
  | Chord
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
  | TRILL_UP
  {
    $$ = 'trill_up'
  }
  | TRILL_DOWN
  {
    $$ = 'trill_down'
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

Chord :
  CHORD_START Inverse Pitches
  {
    $$ = {};
    $$.ctrl = 'chord';
    $$.transpose = $2.transpose;
    $$.inv = $2.inv;
    $$.pitch = $3;
  }
  ;

Inverse :
  Inverse 'i'
  {
    $1.inv += 1;
    $$ = $1;
  }
  | Inverse P1
  {
    if(typeof $2 == 'number'){
      $1.transpose += $2;
    }else{
      // other ornament
    }

    $$ = $1;
  }
  |
  {
    $$ = {inv: 0, transpose: 0};
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
  | ',' '^'
  {
    $$ = {
      original: 1,
      ornament: 'tie'
    }
  }
  |
  { $$ = 1}
  ;
